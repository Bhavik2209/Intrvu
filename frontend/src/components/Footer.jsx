import React, { useState, useEffect } from 'react';

function Footer() {
  const [version, setVersion] = useState('0.0.0');

  useEffect(() => {
    if (chrome.runtime && chrome.runtime.getManifest) {
      setVersion(chrome.runtime.getManifest().version);
    }
  }, []);

  return (
    <div className="footer">
      Job Match Assistant v<span id="ext-version">{version}</span>
      <br />
      All rights reserved ©2025 IntrvuFit - Resume optimizer
    </div>
  );
}

export default Footer;
