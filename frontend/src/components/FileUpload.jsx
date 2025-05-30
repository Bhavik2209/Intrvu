import React from 'react';

function FileUpload({ onFileChange, resumeStatusMessage, resumeStatusClassName }) {
  const handleInputChange = (event) => {
    const file = event.target.files[0];
    onFileChange(file);
  };

  return (
    <div className="upload-section">
      <label htmlFor="resumeUpload" className="upload-label">Upload Your Resume</label>
      <div className="file-input-wrapper">
        <div className="custom-file-input">
          <svg className="custom-file-input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="custom-file-input-text">Drag and drop your PDF resume or click to browse</div>
          <div className="custom-file-input-hint"> - (Maximum file size: 3MB) -</div>
          {/* Connect input to handler, make it a controlled component if needed for reset, but for file inputs, uncontrolled is often simpler. */}
          <input type="file" id="resumeUpload" accept=".pdf" onChange={handleInputChange} />
        </div>
      </div>
      <div id="resumeStatus" className={resumeStatusClassName}> {/* Apply dynamic class */}
        {resumeStatusMessage} {/* Display dynamic message */}
      </div>
    </div>
  );
}

export default FileUpload;
