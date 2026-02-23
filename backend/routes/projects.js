import express from 'express';
import { verifyToken } from './auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';

const router = express.Router();

// Create project
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const result = await runAsync(
      'INSERT INTO projects (user_id, title, description) VALUES (?, ?, ?)',
      [req.user.id, title, description || null]
    );

    res.status(201).json({
      message: 'Project created',
      project: {
        id: result.id,
        title,
        description: description || null,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get user's projects
router.get('/', verifyToken, async (req, res) => {
  try {
    const projects = await allAsync(
      `SELECT id, title, description, created_at, updated_at FROM projects
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    // Add paper count for each project
    const projectsWithCount = await Promise.all(
      projects.map(async (project) => {
        const countResult = await getAsync(
          'SELECT COUNT(*) as count FROM saved_papers WHERE project_id = ?',
          [project.id]
        );
        return {
          ...project,
          paperCount: countResult.count || 0
        };
      })
    );

    res.json({ projects: projectsWithCount });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getAsync(
      `SELECT id, title, description, created_at, updated_at FROM projects
       WHERE id = ? AND user_id = ?`,
      [projectId, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const countResult = await getAsync(
      'SELECT COUNT(*) as count FROM saved_papers WHERE project_id = ?',
      [projectId]
    );

    const savedPapers = await allAsync(
      `SELECT id, openalex_id, title, authors, doi, saved_at
       FROM saved_papers WHERE project_id = ?
       ORDER BY saved_at DESC`,
      [projectId]
    );

    res.json({
      project: {
        ...project,
        paperCount: countResult.count || 0,
        savedPapers
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;

    // Verify project belongs to user
    const project = await getAsync(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await runAsync(
      'UPDATE projects SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title || null, description || null, projectId]
    );

    const updated = await getAsync(
      'SELECT id, title, description, created_at, updated_at FROM projects WHERE id = ?',
      [projectId]
    );

    res.json({
      message: 'Project updated',
      project: updated
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:projectId', verifyToken, async (req, res) => {
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

    await runAsync('DELETE FROM projects WHERE id = ?', [projectId]);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Export project references
router.get('/:projectId/export', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'bib' } = req.query; // bib or text

    // Verify project belongs to user
    const project = await getAsync(
      'SELECT id, title FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const papers = await allAsync(
      `SELECT openalex_id, title, authors, doi, saved_at
       FROM saved_papers WHERE project_id = ?
       ORDER BY saved_at DESC`,
      [projectId]
    );

    let content;

    if (format === 'bib') {
      // BibTeX format
      content = papers
        .map((paper, index) => {
          const key = paper.doi ? paper.doi.replace(/[^a-zA-Z0-9]/g, '') : `paper${index}`;
          const authors = paper.authors || 'Unknown';
          return `@article{${key},
  title={${paper.title}},
  author={${authors}},
  doi={${paper.doi || 'N/A'}},
  url={https://doi.org/${paper.doi || '#'}}
}`;
        })
        .join('\n\n');
    } else {
      // Text format with citations
      content = `References for Project: ${project.title}\n\n`;
      content += papers
        .map((paper, index) => {
          return `${index + 1}. ${paper.title}\n   Authors: ${paper.authors || 'Unknown'}\n   DOI: ${paper.doi || 'N/A'}\n`;
        })
        .join('\n');
    }

    const filename = `${project.title.replace(/\s+/g, '_')}_references.${format === 'bib' ? 'bib' : 'txt'}`;

    res.setHeader('Content-Type', format === 'bib' ? 'application/x-bibtex' : 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export references' });
  }
});

export default router;