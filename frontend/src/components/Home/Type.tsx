import React from "react";
import { profile } from "../../data/profile";

function Type(): JSX.Element {
  return (
    <div className="hero-role-list" aria-label="nahollo 포지셔닝">
      {profile.roleHeadlines.map((headline) => (
        <span className="hero-role-chip" key={headline}>
          {headline}
        </span>
      ))}
    </div>
  );
}

export default Type;
