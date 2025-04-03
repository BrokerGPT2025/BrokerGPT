import React from 'react';

const StyleSheetViewer: React.FC = () => {
  // Vite serves files relative to the project root in development
  const htmlPath = '/Stylesheet/style.html';

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 60px)' }}> {/* Adjust height as needed */}
      <h2>Stylesheet Preview</h2>
      <p>Displaying content from: <code>{htmlPath}</code></p>
      <iframe
        src={htmlPath}
        title="Stylesheet Preview"
        style={{
          width: '100%',
          height: 'calc(100% - 60px)', // Adjust based on surrounding elements
          border: '1px solid #ccc',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default StyleSheetViewer;
