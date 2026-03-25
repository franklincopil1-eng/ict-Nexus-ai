import React from 'react';

const Atmosphere = () => (
  <div className="atmosphere">
    <div className="blob blob-emerald" />
    <div className="blob blob-blue" />
    <div className="blob blob-purple" />
  </div>
);

export default React.memo(Atmosphere);
