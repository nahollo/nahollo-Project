import React, { ReactNode } from "react";
import AWS from "../../assets/TechIcons/AWS.svg";
import Javascript from "../../assets/TechIcons/Javascript.svg";
import Mongo from "../../assets/TechIcons/Mongo.svg";
import Node from "../../assets/TechIcons/Node.svg";
import Python from "../../assets/TechIcons/Python.svg";
import ReactIcon from "../../assets/TechIcons/React.svg";
import SQL from "../../assets/TechIcons/SQL.svg";
import Typescript from "../../assets/TechIcons/Typescript.svg";

interface StackItem {
  icon: ReactNode;
  label: string;
  tone?: "core" | "support";
}

interface StackGroup {
  description: string;
  items: StackItem[];
  label: string;
  title: string;
}

const imageIcon = (src: string, alt: string, className = "stack-chip-icon"): JSX.Element => (
  <img src={src} alt={alt} className={className} />
);

const glyphIcon = (text: string): JSX.Element => (
  <span className="stack-chip-glyph" aria-hidden="true">
    {text}
  </span>
);

const stackGroups: StackGroup[] = [
  {
    label: "Frontend",
    title: "React · TypeScript · React Native",
    description: "제품 화면과 모바일 경험을 구현할 때 가장 자주 쓰는 프론트엔드 축입니다.",
    items: [
      { label: "React", icon: imageIcon(ReactIcon, "React"), tone: "core" },
      { label: "TypeScript", icon: imageIcon(Typescript, "TypeScript"), tone: "core" },
      { label: "JavaScript", icon: imageIcon(Javascript, "JavaScript") },
      { label: "React Native", icon: glyphIcon("RN"), tone: "core" },
      { label: "CSS3", icon: glyphIcon("CSS") }
    ]
  },
  {
    label: "Service Flow",
    title: "Spring Boot · PostgreSQL · AWS",
    description: "브라우저에서 시작한 흐름을 API, 데이터베이스, 배포까지 잇는 서비스 축입니다.",
    items: [
      { label: "Spring Boot", icon: glyphIcon("SB"), tone: "core" },
      { label: "Node.js", icon: imageIcon(Node, "Node.js") },
      { label: "PostgreSQL", icon: imageIcon(SQL, "PostgreSQL"), tone: "core" },
      { label: "AWS EC2/S3", icon: imageIcon(AWS, "AWS"), tone: "core" },
      { label: "Flask", icon: glyphIcon("FL") }
    ]
  },
  {
    label: "Data / Automation",
    title: "Collection · Classification · Recommendation",
    description: "수집, 분류, 추천 파이프라인을 직접 다뤄오며 확장한 데이터 자동화 경험입니다.",
    items: [
      { label: "Python", icon: imageIcon(Python, "Python"), tone: "core" },
      { label: "Playwright", icon: glyphIcon("PW") },
      { label: "Puppeteer", icon: glyphIcon("PP") },
      { label: "MongoDB", icon: imageIcon(Mongo, "MongoDB") },
      { label: "KoSimCSE", icon: glyphIcon("KS") },
      { label: "ETRI OpenAPI", icon: glyphIcon("ET") }
    ]
  }
];

function Techstack(): JSX.Element {
  return (
    <div className="about-stack-grid">
      {stackGroups.map((group) => (
        <article className="about-stack-card surface-card" key={group.label}>
          <span className="about-stack-label">{group.label}</span>
          <h3 className="about-stack-title">{group.title}</h3>
          <p className="about-stack-description">{group.description}</p>
          <div className="about-stack-items">
            {group.items.map((item) => (
              <span className={`about-stack-chip ${item.tone === "core" ? "is-core" : ""}`} key={item.label}>
                <span className="about-stack-chip-icon-wrap">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export default Techstack;
