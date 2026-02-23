import express from 'express';
import axios from 'axios';
import { verifyToken } from './auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';

const router = express.Router();

// Get paper details (with caching)
router.get('/:openalexId', async (req, res) => {
  try {
    const { openalexId } = req.params;

    // Check cache first
    let cachedPaper = await getAsync(
      'SELECT * FROM cached_papers WHERE openalex_id = ?',
      [openalexId]
    );

    if (cachedPaper) {
      try {
        cachedPaper.authors = JSON.parse(cachedPaper.authors || '[]');
        cachedPaper.openalex_data = cachedPaper.openalex_data ? JSON.parse(cachedPaper.openalex_data) : null;
      } catch (e) {
        // parsing error, continue
      }
      return res.json({
        paper: cachedPaper,
        fromCache: true
      });
    }

    // Fetch from OpenAlex
    const response = await axios.get(`https://api.openalex.org/works/${openalexId}`);
    const work = response.data;

    const authors = (work.authorships || []).map(auth => ({
      name: auth.author?.display_name,
      id: auth.author?.id,
      institution: auth.institutions?.[0]?.display_name
    }));

    const abstract = work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : null;

    const paper = {
      openalex_id: work.id,
      title: work.title,
      abstract,
      authors: JSON.stringify(authors),
      journal: work.primary_location?.source?.display_name || work.host_venue?.display_name || null,
      year: work.publication_year,
      doi: work.doi,
      citation_count: work.cited_by_count || 0,
      is_oa: work.is_oa ? 1 : 0,
      pdf_url: work.open_access?.oa_url || null,
      openalex_data: JSON.stringify({
        concepts: work.topics || [],
        publicationDate: work.publication_date,
        keywords: work.keywords || []
      })
    };

    // Cache the paper
    try {
      await runAsync(
        `INSERT OR IGNORE INTO cached_papers 
         (openalex_id, title, abstract, authors, journal, year, doi, citation_count, is_oa, pdf_url, openalex_data, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OpenAlex')`,
        [
          paper.openalex_id,
          paper.title,
          paper.abstract,
          paper.authors,
          paper.journal,
          paper.year,
          paper.doi,
          paper.citation_count,
          paper.is_oa,
          paper.pdf_url,
          paper.openalex_data
        ]
      );
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
    }

    // Parse authors back for response
    paper.authors = authors;
    paper.openalex_data = JSON.parse(paper.openalex_data);

    res.json({
      paper,
      fromCache: false
    });
  } catch (error) {
    console.error('Get paper error:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// Save paper (authenticated)
router.post('/:openalexId/save', verifyToken, async (req, res) => {
  try {
    const { openalexId } = req.params;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' });
    }

    // Verify project belongs to user
    const project = await getAsync(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get paper details
    const paperResponse = await axios.get(`https://api.openalex.org/works/${openalexId}`);
    const work = paperResponse.data;

    const authors = (work.authorships || [])
      .slice(0, 3)
      .map(a => a.author?.display_name)
      .join(', ');

    try {
      await runAsync(
        `INSERT INTO saved_papers (project_id, openalex_id, title, authors, doi)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(project_id, openalex_id) DO NOTHING`,
        [projectId, openalexId, work.title, authors, work.doi]
      );

      res.status(201).json({
        message: 'Paper saved successfully',
        paperId: openalexId
      });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Paper already saved to this project' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Save paper error:', error);
    res.status(500).json({ error: 'Failed to save paper' });
  }
});

// Remove saved paper
router.delete('/:paperId/save', verifyToken, async (req, res) => {
  try {
    const { paperId } = req.params;

    // Verify the saved paper belongs to user's project
    const savedPaper = await getAsync(
      `SELECT sp.id FROM saved_papers sp
       JOIN projects p ON sp.project_id = p.id
       WHERE sp.id = ? AND p.user_id = ?`,
      [paperId, req.user.id]
    );

    if (!savedPaper) {
      return res.status(404).json({ error: 'Saved paper not found' });
    }

    await runAsync('DELETE FROM saved_papers WHERE id = ?', [paperId]);

    res.json({ message: 'Paper removed from project' });
  } catch (error) {
    console.error('Remove paper error:', error);
    res.status(500).json({ error: 'Failed to remove paper' });
  }
});

// Get saved papers for a project
router.get('/project/:projectId/papers', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await getAsync(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const papers = await allAsync(
      `SELECT sp.id, sp.openalex_id, sp.title, sp.authors, sp.doi, sp.saved_at
       FROM saved_papers sp
       WHERE sp.project_id = ?
       ORDER BY sp.saved_at DESC`,
      [projectId]
    );

    res.json({ papers });
  } catch (error) {
    console.error('Get saved papers error:', error);
    res.status(500).json({ error: 'Failed to fetch saved papers' });
  }
});

// Helper function
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return null;
  const words = new Array(Math.max(...Object.values(invertedIndex).flat()) + 1);
  Object.entries(invertedIndex).forEach(([word, positions]) => {
    positions.forEach(pos => {
      words[pos] = word;
    });
  });
  return words.join(' ');
}

export default router;