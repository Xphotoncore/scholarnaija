# ScholarNaija - Nigerian Academic Research Hub

Free academic journal access for Nigerian university students.

## Overview

ScholarNaija is a comprehensive academic research discovery platform that aggregates open-access papers using OpenAlex and Crossref APIs. It provides a student-friendly interface for searching, saving, and citing academic papers.

## Features

### Core Features
- **Smart Research Search** - Search papers by keywords, authors, institutions, and subjects
- **Real-time Suggestions** - Autocomplete suggestions as you type
- **Advanced Filters** - Filter by year range, open-access status, and more
- **Paper Details** - View comprehensive information about academic papers
- **Citation Generator** - Generate citations in APA, MLA, Chicago, and Harvard formats
- **Project Management** - Create research projects and organize saved papers
- **Export Capabilities** - Export references as BibTeX or text format

### User Access Levels
- **Unregistered Users**: Can search papers, view details, generate citations
- **Registered Users**: Can create projects, save papers, export references

## Technology Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- Tailwind CSS (CDN)
- Axios for API calls

### Backend
- Node.js + Express
- SQLite (file-based database)
- JWT Authentication
- OpenAlex API integration
- Crossref API integration

## Project Structure

```
scholarnaija/
├── app/                          # Next.js app directory
│   ├── layout.js                # Root layout
│   ├── page.js                  # Homepage
│   ├── search/                  # Search results page
│   ├── paper/[id]/              # Paper detail page
│   ├── register/                # Registration page
│   ├── login/                   # Login page
│   ├── dashboard/               # User dashboard
│   ├── profile/                 # User profile
│   ├── projects/                # Projects list & management
│   └── projects/[id]/           # Project detail page
├── components/                   # React components
│   ├── Header.js                # Navigation header
│   ├── Footer.js                # Footer
│   ├── SearchBar.js             # Search component
│   └── PaperCard.js             # Paper card component
├── lib/                         # Utility functions
│   ├── api.js                   # API client
│   ├── storage.js               # Local storage utilities
│   └── utils.js                 # Helper functions
├── backend/                     # Backend server
│   ├── server.js                # Express server
│   ├── db.js                    # Database setup
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── search.js            # Search routes
│   │   ├── papers.js            # Paper routes
│   │   ├── projects.js          # Project routes
│   │   └── citations.js         # Citation routes
│   ├── package.json
│   └── database.db              # SQLite database (auto-created)
├── package.json                 # Frontend dependencies
├── next.config.js               # Next.js configuration
└── README.md                    # This file
```

## Getting Started

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend && npm install && cd ..
```

### Running the Application

The system automatically handles installation and execution:

**Frontend** (Next.js):
- Runs on port 8080
- Automatically starts development server

**Backend** (Express):
- Runs on port 3000
- SQLite database auto-initializes
- Connects to OpenAlex and Crossref APIs (no keys required)

### Environment Variables

Create a `.env.local` file in the root directory (copy from `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

The backend uses these defaults (can be customized):
- `PORT=3000`
- `JWT_SECRET=scholarnaija-secret-key-change-in-production`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)
- `PUT /api/auth/profile` - Update user profile (requires token)

### Search
- `GET /api/search/papers` - Search academic papers
- `GET /api/search/trending-nigeria` - Get trending topics in Nigeria
- `GET /api/search/suggestions` - Get autocomplete suggestions

### Papers
- `GET /api/papers/:openalexId` - Get paper details
- `POST /api/papers/:openalexId/save` - Save paper (requires token)
- `DELETE /api/papers/:paperId/save` - Remove saved paper (requires token)
- `GET /api/papers/project/:projectId/papers` - Get saved papers (requires token)

### Projects
- `POST /api/projects` - Create project (requires token)
- `GET /api/projects` - Get user's projects (requires token)
- `GET /api/projects/:projectId` - Get project details (requires token)
- `PUT /api/projects/:projectId` - Update project (requires token)
- `DELETE /api/projects/:projectId` - Delete project (requires token)
- `GET /api/projects/:projectId/export` - Export references (requires token)

### Citations
- `GET /api/citations/:doi` - Generate citation (supports format param)
- `POST /api/citations/batch` - Generate multiple citations (requires token)

## Database Schema

### Users
- `id` (INTEGER PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `password_hash` (TEXT)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `institution` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Projects
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER FK)
- `title` (TEXT)
- `description` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### SavedPapers
- `id` (INTEGER PRIMARY KEY)
- `project_id` (INTEGER FK)
- `openalex_id` (TEXT)
- `title` (TEXT)
- `authors` (TEXT)
- `doi` (TEXT)
- `saved_at` (DATETIME)

### CachedPapers
- `id` (INTEGER PRIMARY KEY)
- `openalex_id` (TEXT UNIQUE)
- `title` (TEXT)
- `abstract` (TEXT)
- `authors` (TEXT JSON)
- `journal` (TEXT)
- `year` (INTEGER)
- `doi` (TEXT)
- `citation_count` (INTEGER)
- `is_oa` (BOOLEAN)
- `pdf_url` (TEXT)
- `openalex_data` (TEXT JSON)
- `source` (TEXT)
- `last_updated` (DATETIME)

## API Integrations

### OpenAlex API
- **Endpoint**: `https://api.openalex.org/works`
- **No API key required**
- Used for paper search and discovery
- Results are cached for performance

### Crossref API
- **Endpoint**: `https://api.crossref.org/works/{doi}`
- **No API key required**
- Used for citation data and metadata enrichment
- Supports multiple citation formats

## Key Features Details

### Search Functionality
- Keyword-based search across titles, abstracts, and author names
- Filter by publication year range
- Filter by open-access status
- Sort by citation count, publication date, or relevance
- Autocomplete suggestions for better UX

### Citation Generator
Supports multiple formats:
- **APA** - American Psychological Association
- **MLA** - Modern Language Association
- **Chicago** - Chicago Manual of Style
- **Harvard** - Harvard citation style

Features:
- Copy citation to clipboard
- Download as BibTeX file
- Batch generate multiple citations

### Student Workspace
- Create unlimited projects
- Organize papers by research topic
- Save papers from search results
- Remove papers from projects
- Export entire project as BibTeX or text format

## Legal Compliance

This platform adheres to all legal requirements:
- ✅ Only shows PDF download for open-access papers (when `is_oa == true`)
- ✅ Always displays DOI links
- ✅ Never hosts or stores copyrighted PDFs
- ✅ Attributes data source (OpenAlex & Crossref)
- ✅ Respects academic copyright and licensing

## Nigeria-Specific Features

- **Localized messaging** - "Free academic journal access for Nigerian university students"
- **Trending topics** - Displays trending research by discipline in Nigeria
- **Popular disciplines** - Engineering, Medicine, Law, Social Sciences, Agriculture, Computer Science
- **Performance optimization** - Designed for lower bandwidth environments

## Performance & Caching

- Search queries cached for 1 hour
- Trending results cached for 6 hours
- Citation data cached for 24 hours
- Paper metadata cached indefinitely with last-updated tracking
- Supports concurrent requests with connection pooling

## Security Features

- JWT-based authentication with 30-day expiration
- Password hashing with bcryptjs
- HTTPS-ready architecture
- CORS configuration for frontend-backend communication
- Foreign key constraints enabled in SQLite
- Input validation on all API endpoints

## Scalability Considerations

The architecture is designed to support future expansion:
- Modular API structure for adding new endpoints
- Database schema supports additional features
- Pluggable authentication system
- Ready for integration with:
  - Additional citation sources (DOAJ)
  - Payment systems
  - Institutional dashboards
  - AI features (Phase 2)

## Troubleshooting

### Port Already in Use
If port 3000 or 8080 is already in use, the system will use alternative ports.

### Database Issues
- SQLite database is automatically created on first run
- Located at `backend/database.db`
- To reset, delete the `.db` file and restart the server

### API Connection Issues
- Verify backend is running on port 3000
- Check network connectivity for OpenAlex/Crossref APIs
- Review browser console for CORS errors

## Future Roadmap (Phase 2)

- AI-powered research assistant
- DOAJ verification for journals
- Subscription-based features
- Payment gateway integration
- Institutional dashboards
- Mobile apps (iOS & Android)
- Advanced analytics
- Collaborative research features

## Support & Feedback

For issues, feature requests, or feedback:
- Check existing documentation
- Review API endpoints for availability
- Verify database connectivity
- Check browser console for errors

## License

MIT License - See LICENSE file for details

## Data Attribution

This platform sources data from:
- **OpenAlex** - https://openalex.org
- **Crossref** - https://www.crossref.org

Both provide free, unrestricted access to academic metadata.