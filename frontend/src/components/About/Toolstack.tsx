import React from "react";
import macOs from "../../assets/TechIcons/Apple MacOSX.svg";
import chrome from "../../assets/TechIcons/Google Chrome.svg";
import intelliJ from "../../assets/TechIcons/intellij-idea.svg";
import vsCode from "../../assets/TechIcons/vscode.svg";

const toolGroups = [
  {
    label: "Build",
    title: "Daily Workspace",
    description: "매일 화면을 만들고 구조를 정리할 때 가장 자주 쓰는 기본 작업 환경입니다.",
    items: [
      { label: "macOS", icon: macOs },
      { label: "VS Code", icon: vsCode },
      { label: "IntelliJ", icon: intelliJ }
    ]
  },
  {
    label: "Review",
    title: "Browser & Check",
    description: "브라우저 확인과 QA, 흐름 점검에 사용하는 검증 환경입니다.",
    items: [{ label: "Google Chrome", icon: chrome }]
  }
];

function Toolstack(): JSX.Element {
  return (
    <div className="about-tool-grid">
      {toolGroups.map((group) => (
        <article className="about-tool-card surface-card" key={group.label}>
          <span className="about-stack-label">{group.label}</span>
          <h3 className="about-stack-title">{group.title}</h3>
          <p className="about-stack-description">{group.description}</p>
          <div className="about-stack-items">
            {group.items.map((item) => (
              <span className="about-stack-chip" key={item.label}>
                <span className="about-stack-chip-icon-wrap">
                  <img src={item.icon} alt={item.label} className="stack-chip-icon" />
                </span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export default Toolstack;
