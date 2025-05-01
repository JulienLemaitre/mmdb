import React from "react";

function Metronome() {
  return (
    <div className="metronome-container">
      <div className="base">
        <div className="bar bar-bottom"></div>
        <div className="bar bar-right"></div>
        <div className="bar bar-left"></div>
        <div className="bar bar-top"></div>
        <div className="bar bar-middle"></div>
        <div className="wheel w-right"></div>
        <div className="wheel w-left"></div>
      </div>
      <div className="stick-container">
        <div className="stick">
          <div className="hole"></div>
          <div className="top"></div>
        </div>
      </div>
    </div>
  );
}

export default Metronome;
