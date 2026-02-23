'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h4 className="text-white font-bold mb-4">ScholarNaija</h4>
            <p className="text-sm text-gray-400">
              Free academic research discovery for Nigerian university students.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-bold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Search Papers</a></li>
              <li><a href="#" className="hover:text-white">Save Papers</a></li>
              <li><a href="#" className="hover:text-white">Generate Citations</a></li>
              <li><a href="#" className="hover:text-white">Export References</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">How to Use</a></li>
              <li><a href="#" className="hover:text-white">Citation Formats</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Copyright</a></li>
            </ul>
          </div>
        </div>

        {/* Attribution */}
        <div className="border-t border-gray-800 pt-8 text-sm text-gray-400 text-center">
          <p className="mb-2">Data sourced from OpenAlex & Crossref</p>
          <p>&copy; 2024 ScholarNaija. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}