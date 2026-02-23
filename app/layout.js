import './globals.css';

export const metadata = {
  title: 'ScholarNaija - Nigerian Academic Research Hub',
  description: 'Free academic journal access for Nigerian university students',
  keywords: ['academic research', 'Nigeria', 'journals', 'papers', 'citations'],
  viewport: 'width=device-width, initial-scale=1.0'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://cdn.tailwindcss.com" rel="stylesheet" />
        <style>
          {`
            :root {
              --primary: #003f87;
              --primary-light: #0052b3;
              --gray-light: #f5f5f5;
              --gray-text: #555;
            }
            
            body {
              background-color: var(--gray-light);
            }
          `}
        </style>
      </head>
      <body className="bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}