'use client';

import Link from 'next/link';
import { truncate } from '@/lib/utils';

export default function PaperCard({ paper, onSave }) {
  return (
    <div className="card p-6 mb-4 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
            <Link href={`/paper/${encodeURIComponent(paper.openalexId || paper.id)}`}>
              {paper.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {paper.authors && Array.isArray(paper.authors)
              ? paper.authors.slice(0, 3).map(a => a.name || a).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')
              : 'Unknown authors'}
          </p>
        </div>

        {/* Citation badge */}
        {paper.citationCount !== undefined && (
          <div className="bg-blue-50 px-3 py-2 rounded-lg text-center min-w-fit">
            <div className="text-2xl font-bold text-blue-600">{paper.citationCount}</div>
            <div className="text-xs text-gray-600">citations</div>
          </div>
        )}
      </div>

      {/* Abstract */}
      {paper.abstract && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {truncate(paper.abstract, 200)}
        </p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600">
        {paper.journal && (
          <span className="bg-gray-100 px-2 py-1 rounded">📰 {truncate(paper.journal, 30)}</span>
        )}
        {paper.year && (
          <span className="bg-gray-100 px-2 py-1 rounded">📅 {paper.year}</span>
        )}
        {paper.isOa && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">🔓 Open Access</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/paper/${encodeURIComponent(paper.openalexId || paper.id)}`}
          className="btn btn-secondary flex-1 text-center"
          style={{ borderColor: '#003f87', color: '#003f87' }}
        >
          View Details
        </Link>

        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost flex-1 text-center"
            style={{ color: '#003f87' }}
          >
            📄 DOI
          </a>
        )}

        {onSave && (
          <button
            onClick={() => onSave(paper)}
            className="btn btn-ghost flex-1 text-center"
            style={{ color: '#003f87' }}
          >
            💾 Save
          </button>
        )}
      </div>
    </div>
  );
}