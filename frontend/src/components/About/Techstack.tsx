import React, { ReactNode } from "react";
import { FaRust } from "react-icons/fa";
import { SiNextdotjs, SiSolidity } from "react-icons/si";
import AWS from "../../Assets/TechIcons/AWS.svg";
import C from "../../Assets/TechIcons/C++.svg";
import Docker from "../../Assets/TechIcons/Docker.svg";
import Firebase from "../../Assets/TechIcons/Firebase.svg";
import Git from "../../Assets/TechIcons/Git.svg";
import Go from "../../Assets/TechIcons/go.svg";
import HaskellIcon from "../../Assets/TechIcons/Haskell.svg";
import Java from "../../Assets/TechIcons/Java.svg";
import Javascript from "../../Assets/TechIcons/Javascript.svg";
import Kafka from "../../Assets/TechIcons/Kafka.svg";
import Kubernates from "../../Assets/TechIcons/Kubernates.svg";
import Mongo from "../../Assets/TechIcons/Mongo.svg";
import MUI from "../../Assets/TechIcons/MUI.svg";
import Node from "../../Assets/TechIcons/Node.svg";
import Postman from "../../Assets/TechIcons/Postman.svg";
import Python from "../../Assets/TechIcons/Python.svg";
import ReactIcon from "../../Assets/TechIcons/React.svg";
import Redis from "../../Assets/TechIcons/Redis.svg";
import Redux from "../../Assets/TechIcons/Redux.svg";
import SQL from "../../Assets/TechIcons/SQL.svg";
import Tailwind from "../../Assets/TechIcons/Tailwind.svg";
import Typescript from "../../Assets/TechIcons/Typescript.svg";

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

const stackGroups: StackGroup[] = [
  {
    label: "Primary",
    title: "Product UI Systems",
    description: "가장 강하게 가져가는 화면 설계와 UI 시스템 중심 기술입니다.",
    items: [
      { label: "React", icon: imageIcon(ReactIcon, "React"), tone: "core" },
      { label: "TypeScript", icon: imageIcon(Typescript, "TypeScript"), tone: "core" },
      { label: "JavaScript", icon: imageIcon(Javascript, "JavaScript") },
      { label: "Next.js", icon: <SiNextdotjs /> },
      { label: "Tailwind CSS", icon: imageIcon(Tailwind, "Tailwind CSS") },
      { label: "Material UI", icon: imageIcon(MUI, "Material UI") },
      { label: "Redux", icon: imageIcon(Redux, "Redux") }
    ]
  },
  {
    label: "Service Flow",
    title: "API · Data Structure",
    description: "브라우저 밖까지 이어지는 요청, 데이터, 서비스 구조를 확장하는 영역입니다.",
    items: [
      { label: "Java", icon: imageIcon(Java, "Java"), tone: "core" },
      { label: "Node.js", icon: imageIcon(Node, "Node.js") },
      { label: "PostgreSQL", icon: imageIcon(SQL, "PostgreSQL"), tone: "core" },
      { label: "Firebase", icon: imageIcon(Firebase, "Firebase") },
      { label: "MongoDB", icon: imageIcon(Mongo, "MongoDB") },
      { label: "Redis", icon: imageIcon(Redis, "Redis") }
    ]
  },
  {
    label: "Delivery",
    title: "Operations & Shipping",
    description: "개발 결과물을 운영 가능한 형태로 연결하기 위해 함께 보는 도구와 플랫폼입니다.",
    items: [
      { label: "Docker", icon: imageIcon(Docker, "Docker"), tone: "core" },
      { label: "AWS", icon: imageIcon(AWS, "AWS"), tone: "core" },
      { label: "Git", icon: imageIcon(Git, "Git") },
      { label: "Postman", icon: imageIcon(Postman, "Postman") },
      { label: "Kubernetes", icon: imageIcon(Kubernates, "Kubernetes") },
      { label: "Kafka", icon: imageIcon(Kafka, "Kafka") }
    ]
  },
  {
    label: "Exploration",
    title: "Exploration",
    description: "직접 실험하고 배우며 기술 감각을 넓히는 데 사용한 언어와 분야입니다.",
    items: [
      { label: "Python", icon: imageIcon(Python, "Python") },
      { label: "Go", icon: imageIcon(Go, "Go") },
      { label: "Rust", icon: <FaRust /> },
      { label: "C++", icon: imageIcon(C, "C++") },
      { label: "Solidity", icon: <SiSolidity /> },
      { label: "Haskell", icon: imageIcon(HaskellIcon, "Haskell") }
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
