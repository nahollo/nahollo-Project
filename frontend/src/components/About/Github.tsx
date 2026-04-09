import React from "react";
import GitHubCalendar from "react-github-calendar";
import { Row } from "react-bootstrap";
import { profile } from "../../data/profile";

function Github(): JSX.Element {
  return (
    <section className="about-github-section">
      <div className="about-section-head">
        <span className="section-eyebrow">Activity</span>
        <h2 className="section-title">
          <strong className="purple">GitHub 활동</strong>도 꾸준히 기록하고 있습니다.
        </h2>
        <p className="section-lead">작업 흔적과 학습 흐름이 실제로 이어지고 있는지 확인하는 용도로 기록합니다.</p>
      </div>

      <div className="github-calendar-shell surface-card">
        <Row
          style={{
            justifyContent: "center",
            paddingBottom: "10px",
            color: "var(--text-color)"
          }}
        >
          <GitHubCalendar
            username={profile.githubUsername}
            blockSize={16}
            blockMargin={6}
            color="var(--accent-color)"
            fontSize={14}
          />
        </Row>
      </div>
    </section>
  );
}

export default Github;
