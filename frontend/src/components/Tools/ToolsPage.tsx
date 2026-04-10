import React, { useMemo, useState } from "react";
import { Container } from "react-bootstrap";

type ToolTab = "json" | "base64" | "timestamp" | "uuid" | "color" | "markdown";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown);
  const withCodeBlocks = escaped.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  const withInlineCode = withCodeBlocks.replace(/`([^`]+)`/g, "<code>$1</code>");
  const withHeadings = withInlineCode
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");
  const withBold = withHeadings.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*(.*?)\*/g, "<em>$1</em>");
  const withLinks = withItalic.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  const withBlockquotes = withLinks.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");
  const withLists = withBlockquotes.replace(/(?:^|\n)- (.*(?:\n- .*)*)/g, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((item) => item.replace(/^- /, "").trim())
      .map((item) => `<li>${item}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  return withLists
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<(h1|h2|h3|pre|ul|blockquote)/.test(block)) {
        return block;
      }

      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const full = normalized.length === 3 ? normalized.split("").map((item) => item + item).join("") : normalized;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }

    hue /= 6;
  }

  return {
    h: Math.round(hue * 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100)
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = clamp(h, 0, 360) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hueToChannel = (channelHue: number) => {
    let value = channelHue;

    if (value < 0) {
      value += 1;
    }
    if (value > 1) {
      value -= 1;
    }
    if (value < 1 / 6) {
      return p + (q - p) * 6 * value;
    }
    if (value < 1 / 2) {
      return q;
    }
    if (value < 2 / 3) {
      return p + (q - p) * (2 / 3 - value) * 6;
    }
    return p;
  };

  return {
    r: Math.round(hueToChannel(hue + 1 / 3) * 255),
    g: Math.round(hueToChannel(hue) * 255),
    b: Math.round(hueToChannel(hue - 1 / 3) * 255)
  };
}

function encodeBase64(value: string): string {
  return window.btoa(String.fromCharCode(...Array.from(new TextEncoder().encode(value))));
}

function decodeBase64(value: string): string {
  return new TextDecoder().decode(Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0)));
}

const toolTabs: readonly { id: ToolTab; label: string; description: string }[] = [
  { id: "json", label: "JSON Formatter", description: "포맷, 미니파이, 기본 검증을 바로 해봅니다." },
  { id: "base64", label: "Base64", description: "문자열을 인코딩하거나 디코딩합니다." },
  { id: "timestamp", label: "Unix Timestamp", description: "현재 시각과 수동 입력을 서로 변환합니다." },
  { id: "uuid", label: "UUID v4", description: "브라우저에서 UUID를 만들고 복사합니다." },
  { id: "color", label: "Color Converter", description: "HEX, RGB, HSL을 서로 변환하며 미리 보기를 확인합니다." },
  { id: "markdown", label: "Markdown Preview", description: "입력한 마크다운을 실시간으로 미리 봅니다." }
];

function ToolsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<ToolTab>("json");
  const [jsonInput, setJsonInput] = useState("{\n  \"name\": \"nahollo\",\n  \"theme\": \"playground\"\n}");
  const [jsonMessage, setJsonMessage] = useState("유효한 JSON입니다.");
  const [base64Input, setBase64Input] = useState("nahollo");
  const [timestampInput, setTimestampInput] = useState(() => `${Date.now()}`);
  const [isoInput, setIsoInput] = useState(() => new Date().toISOString().slice(0, 16));
  const [uuidValue, setUuidValue] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `nahollo-${Math.random().toString(16).slice(2, 10)}`
  );
  const [hex, setHex] = useState("#5E89D5");
  const [rgb, setRgb] = useState("94, 137, 213");
  const [hsl, setHsl] = useState("217, 59%, 60%");
  const [markdownInput, setMarkdownInput] = useState("# nahollo\n\n- playground\n- homelab\n- tools\n\n> leave a mark");

  const activeTool = toolTabs.find((tab) => tab.id === activeTab) ?? toolTabs[0];

  const jsonOutput = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonInput;
    }
  }, [jsonInput]);

  const base64Encoded = useMemo(() => {
    try {
      return encodeBase64(base64Input);
    } catch (error) {
      return "인코딩할 수 없습니다.";
    }
  }, [base64Input]);

  const base64Decoded = useMemo(() => {
    try {
      return decodeBase64(base64Input);
    } catch (error) {
      return "디코딩할 수 없습니다.";
    }
  }, [base64Input]);

  const timestampDate = useMemo(() => {
    const raw = Number(timestampInput);
    if (Number.isNaN(raw)) {
      return "숫자를 입력해 주세요.";
    }

    const value = timestampInput.length <= 10 ? raw * 1000 : raw;
    return new Date(value).toLocaleString("ko-KR");
  }, [timestampInput]);

  const isoTimestamp = useMemo(() => {
    const date = new Date(isoInput);
    return Number.isNaN(date.getTime()) ? "날짜 형식이 올바르지 않습니다." : `${Math.floor(date.getTime() / 1000)} / ${date.getTime()}`;
  }, [isoInput]);

  const markdownHtml = useMemo(() => renderMarkdown(markdownInput), [markdownInput]);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setJsonMessage("포맷 완료");
    } catch (error) {
      setJsonMessage("JSON 파싱에 실패했습니다.");
    }
  };

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      setJsonMessage("Minify 완료");
    } catch (error) {
      setJsonMessage("JSON 파싱에 실패했습니다.");
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      // Ignore clipboard failures in unsupported browsers.
    }
  };

  const syncFromHex = (value: string) => {
    setHex(value);
    const rgbValue = hexToRgb(value);
    if (!rgbValue) {
      return;
    }

    setRgb(`${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}`);
    const hslValue = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b);
    setHsl(`${hslValue.h}, ${hslValue.s}%, ${hslValue.l}%`);
  };

  const syncFromRgb = (value: string) => {
    setRgb(value);
    const parts = value.split(",").map((item) => Number(item.trim()));
    if (parts.length !== 3 || parts.some((item) => Number.isNaN(item))) {
      return;
    }

    const nextHex = rgbToHex(parts[0], parts[1], parts[2]);
    setHex(nextHex);
    const hslValue = rgbToHsl(parts[0], parts[1], parts[2]);
    setHsl(`${hslValue.h}, ${hslValue.s}%, ${hslValue.l}%`);
  };

  const syncFromHsl = (value: string) => {
    setHsl(value);
    const matches = value
      .replace(/%/g, "")
      .split(",")
      .map((item) => Number(item.trim()));
    if (matches.length !== 3 || matches.some((item) => Number.isNaN(item))) {
      return;
    }

    const rgbValue = hslToRgb(matches[0], matches[1], matches[2]);
    setRgb(`${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}`);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  return (
    <section className="playground-page page-tools">
      <Container className="playground-shell tools-shell">
        <header className="page-intro">
          <div className="page-intro-head">
            <span className="section-eyebrow">Tools</span>
            <h1 className="page-title glow-text">browser tool bench</h1>
            <p className="page-intro-description">브라우저 안에서 바로 꺼내 쓰는 작은 개발 도구들입니다. 가볍고 빠르게 확인하고 복사할 수 있습니다.</p>
          </div>
        </header>

        <div className="tools-layout">
          <aside className="tools-sidebar nahollo-card">
            <div className="tools-sidebar-head">
              <span className="section-eyebrow">Tab list</span>
              <h2>{activeTool.label}</h2>
              <p>{activeTool.description}</p>
            </div>

            <nav className="tools-tab-list" aria-label="Tool tabs">
              {toolTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tools-tab ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="tools-panel nahollo-card">
            {activeTab === "json" && (
              <div className="tools-workspace">
                <div className="tools-workspace-head">
                  <h2>JSON Formatter & Validator</h2>
                  <div className="tools-inline-actions">
                    <button type="button" className="header-link" onClick={handleFormatJson}>
                      Format
                    </button>
                    <button type="button" className="header-link" onClick={handleMinifyJson}>
                      Minify
                    </button>
                  </div>
                </div>
                <div className="tools-grid two-column">
                  <div className="tools-stack">
                    <textarea className="play-textarea" value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} />
                    <p className="game-helper-text">{jsonMessage}</p>
                  </div>
                  <div className="tools-stack">
                    <textarea className="play-textarea" value={jsonOutput} readOnly />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "base64" && (
              <div className="tools-workspace">
                <div className="tools-workspace-head">
                  <h2>Base64 Encoder / Decoder</h2>
                </div>
                <div className="tools-grid two-column">
                  <div className="tools-stack">
                    <textarea className="play-textarea" value={base64Input} onChange={(event) => setBase64Input(event.target.value)} />
                  </div>
                  <div className="tools-stack">
                    <label>
                      <span className="section-eyebrow">Encoded</span>
                      <textarea className="play-textarea" value={base64Encoded} readOnly />
                    </label>
                    <label>
                      <span className="section-eyebrow">Decoded</span>
                      <textarea className="play-textarea" value={base64Decoded} readOnly />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timestamp" && (
              <div className="tools-workspace">
                <div className="tools-workspace-head">
                  <h2>Unix Timestamp Converter</h2>
                  <div className="tools-inline-actions">
                    <button type="button" className="header-link" onClick={() => setTimestampInput(`${Date.now()}`)}>
                      Now (ms)
                    </button>
                    <button type="button" className="header-link" onClick={() => setTimestampInput(`${Math.floor(Date.now() / 1000)}`)}>
                      Now (s)
                    </button>
                  </div>
                </div>
                <div className="tools-stack">
                  <input className="play-input" value={timestampInput} onChange={(event) => setTimestampInput(event.target.value)} />
                  <p className="game-helper-text">{timestampDate}</p>
                  <input className="play-input" type="datetime-local" value={isoInput} onChange={(event) => setIsoInput(event.target.value)} />
                  <p className="game-helper-text">{isoTimestamp}</p>
                </div>
              </div>
            )}

            {activeTab === "uuid" && (
              <div className="tools-workspace">
                <div className="tools-workspace-head">
                  <h2>UUID v4 Generator</h2>
                  <div className="tools-inline-actions">
                    <button
                      type="button"
                      className="header-link"
                      onClick={() =>
                        setUuidValue(
                          typeof crypto !== "undefined" && "randomUUID" in crypto
                            ? crypto.randomUUID()
                            : `nahollo-${Math.random().toString(16).slice(2, 10)}`
                        )
                      }
                    >
                      Generate
                    </button>
                    <button type="button" className="header-link" onClick={() => void handleCopy(uuidValue)}>
                      Copy
                    </button>
                  </div>
                </div>
                <textarea className="play-textarea" value={uuidValue} readOnly />
              </div>
            )}

            {activeTab === "color" && (
              <div className="tools-workspace">
                <div className="tools-workspace-head">
                  <h2>Color Converter</h2>
                </div>
                <div className="tools-grid two-column">
                  <div className="tools-stack">
                    <label>
                      <span className="section-eyebrow">HEX</span>
                      <input className="play-input" value={hex} onChange={(event) => syncFromHex(event.target.value)} />
                    </label>
                    <label>
                      <span className="section-eyebrow">RGB</span>
                      <input className="play-input" value={rgb} onChange={(event) => syncFromRgb(event.target.value)} />
                    </label>
                    <label>
                      <span className="section-eyebrow">HSL</span>
                      <input className="play-input" value={hsl} onChange={(event) => syncFromHsl(event.target.value)} />
                    </label>
                  </div>
                  <div className="tools-stack">
                    <div className="tools-color-swatch" style={{ backgroundColor: hex }} />
                    <button type="button" className="header-link" onClick={() => void handleCopy(hex)}>
                      색상값 복사
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "markdown" && (
              <div className="tools-workspace">
                <div className="tools-workspace-head">
                  <h2>Markdown Live Preview</h2>
                </div>
                <div className="tools-grid two-column">
                  <textarea className="play-textarea markdown-editor" value={markdownInput} onChange={(event) => setMarkdownInput(event.target.value)} />
                  <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
                </div>
              </div>
            )}
          </section>
        </div>
      </Container>
    </section>
  );
}

export default ToolsPage;
