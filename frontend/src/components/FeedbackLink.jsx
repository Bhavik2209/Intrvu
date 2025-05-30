import React from 'react';

function FeedbackLink() {
  return (
    <a
      href="https://docs.google.com/forms/d/e/1FAIpQLScPbR00X61FeowQmDIkfuU4AKMcoGm335DI2UOGHwdYVX2_sA/viewform"
      target="_blank"
      rel="noopener noreferrer" // Good practice for target="_blank"
      className="feedback-link"
    >
      Feedback
    </a>
  );
}

export default FeedbackLink;
