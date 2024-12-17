import React from "react";

function SnowballMetronome() {
  return (
    <div className="snowball">
      <div className="ball">
        <div className="fall">
          <div className="snowFlakes1"></div>
          <div className="snowFlakes2"></div>
          <div className="snowFlakes3"></div>
          <div className="snowFlakes4"></div>
          <div className="snowFlakes5"></div>
          <div className="snowFlakes6"></div>
          <div className="snowFlakes7"></div>
          <div className="snowFlakes8"></div>
          <div className="snowFlakes9"></div>
          <div className="snowFlakes10"></div>
        </div>

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
      </div>
      {/*<div className="holder">
        <div className="text">Merry Christmas!</div>
      </div>*/}
    </div>
  );
}

export default SnowballMetronome;
