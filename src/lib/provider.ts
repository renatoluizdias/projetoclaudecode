import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Create CSS file with custom styles and animations
    if (toolMessageCount === 2) {
      const text = `Adding custom styles and animations.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/styles/main.css`,
          file_text: this.getCssCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import { useState } from 'react';
import { motion } from 'framer-motion';

const ContactForm = () => {
  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const onChange = (e) => setFields(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <motion.div
      className="form-card"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
    >
      <h2 className="form-title">Get in touch</h2>
      <p className="form-subtitle">We'll respond within 24 hours.</p>
      {sent ? (
        <motion.p
          className="success-msg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          ✓ Message sent! We'll be in touch soon.
        </motion.p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field">
            <input type="text" name="name" id="name" placeholder=" " value={fields.name} onChange={onChange} required />
            <label htmlFor="name">Your name</label>
          </div>
          <div className="field">
            <input type="email" name="email" id="email" placeholder=" " value={fields.email} onChange={onChange} required />
            <label htmlFor="email">Email address</label>
          </div>
          <div className="field">
            <textarea name="message" id="message" placeholder=" " rows={4} value={fields.message} onChange={onChange} required />
            <label htmlFor="message">Message</label>
          </div>
          <motion.button
            type="submit"
            className="submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Send message →
          </motion.button>
        </form>
      )}
    </motion.div>
  );
};

export default ContactForm;`;

      case "card":
        return `import { motion } from 'framer-motion';

const Card = () => {
  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="card-glow" />
      <div className="avatar-wrap">
        <motion.div
          className="avatar-ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="avatar">JD</div>
      </div>
      <h2 className="card-name">Jane Doe</h2>
      <p className="card-role">Senior Product Designer</p>
      <p className="card-bio">Crafting digital experiences that feel effortless. Based in São Paulo.</p>
      <div className="card-stats">
        <div className="stat"><span>128</span><label>Projects</label></div>
        <div className="stat"><span>4.9★</span><label>Rating</label></div>
        <div className="stat"><span>3 yrs</span><label>Experience</label></div>
      </div>
      <div className="card-actions">
        <motion.button className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          Follow
        </motion.button>
        <motion.button className="btn-secondary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          Message
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Counter = () => {
  const [count, setCount] = useState(0);
  const [direction, setDirection] = useState(1);

  const change = (delta) => {
    setDirection(delta > 0 ? 1 : -1);
    setCount(prev => prev + delta);
  };

  return (
    <div className="counter-wrap">
      <div className="counter-bg" />
      <p className="counter-label">Score</p>
      <div className="counter-display">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            className="counter-number"
            initial={{ y: direction * 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction * -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="counter-controls">
        <motion.button className="btn btn-minus" onClick={() => change(-1)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
          −
        </motion.button>
        <motion.button className="btn btn-reset" onClick={() => { setDirection(0); setCount(0); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          ↺
        </motion.button>
        <motion.button className="btn btn-plus" onClick={() => change(1)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
          +
        </motion.button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getCssCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body { font-family: 'Inter', sans-serif; }

.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 30% 20%, #1a1035 0%, #0f0f17 60%);
}

.form-card {
  width: 420px;
  padding: 48px 40px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  backdrop-filter: blur(20px);
}

.form-title {
  color: #f0effe;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 6px;
}

.form-subtitle {
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  margin-bottom: 36px;
}

.field {
  position: relative;
  margin-bottom: 24px;
}

.field input,
.field textarea {
  width: 100%;
  padding: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #f0effe;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  resize: none;
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(129, 140, 248, 0.6);
  background: rgba(255,255,255,0.06);
}

.field label {
  position: absolute;
  top: 16px;
  left: 16px;
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  pointer-events: none;
  transition: transform 0.2s, color 0.2s;
  transform-origin: left top;
}

.field input:focus ~ label,
.field input:not(:placeholder-shown) ~ label,
.field textarea:focus ~ label,
.field textarea:not(:placeholder-shown) ~ label {
  transform: translateY(-28px) scale(0.8);
  color: #818cf8;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.35);
  transition: box-shadow 0.2s;
}

.submit-btn:hover { box-shadow: 0 12px 40px rgba(99, 102, 241, 0.5); }

.success-msg {
  text-align: center;
  color: #86efac;
  font-size: 15px;
  margin-top: 32px;
  font-weight: 500;
}`;

      case "card":
        return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body { font-family: 'Inter', sans-serif; }

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.9; transform: translateX(-50%) scale(1.15); }
}

.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 40% 30%, #1c1040 0%, #0a0a12 70%);
}

.profile-card {
  position: relative;
  width: 320px;
  padding: 40px 28px 32px;
  background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  backdrop-filter: blur(24px);
  text-align: center;
  overflow: hidden;
  animation: float 6s ease-in-out infinite;
}

.card-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(124,58,237,0.55), transparent 70%);
  animation: glow-pulse 3.5s ease-in-out infinite;
  pointer-events: none;
}

.avatar-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0 auto 20px;
}

.avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: conic-gradient(#7c3aed, #ec4899, #f59e0b, #7c3aed);
}

.avatar {
  position: relative;
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  margin: 3px;
  border-radius: 50%;
  background: #140d24;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  color: #e5d4ff;
  z-index: 1;
}

.card-name {
  color: #f1eeff;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.card-role {
  color: rgba(255,255,255,0.45);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.card-bio {
  color: rgba(255,255,255,0.4);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.card-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid rgba(255,255,255,0.07);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 24px;
}

.stat { display: flex; flex-direction: column; gap: 4px; }

.stat span {
  color: #f1eeff;
  font-size: 18px;
  font-weight: 700;
}

.stat label {
  color: rgba(255,255,255,0.35);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

.card-actions { display: flex; gap: 10px; }

.btn-primary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(124,58,237,0.4);
  transition: box-shadow 0.2s;
}

.btn-primary:hover { box-shadow: 0 10px 36px rgba(124,58,237,0.6); }

.btn-secondary {
  flex: 1;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.7);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover { background: rgba(255,255,255,0.1); }`;

      default:
        return `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body { font-family: 'Space Grotesk', sans-serif; }

@keyframes orbit {
  from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
}

.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0d1628 0%, #060a12 100%);
}

.counter-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
}

.counter-bg {
  position: absolute;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.counter-label {
  color: rgba(255,255,255,0.35);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
}

.counter-display {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(99,102,241,0.15), inset 0 0 40px rgba(0,0,0,0.3);
}

.counter-number {
  position: absolute;
  font-size: 64px;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.counter-controls { display: flex; gap: 16px; align-items: center; }

.btn {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 16px;
  font-size: 22px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.btn-minus {
  background: rgba(239,68,68,0.12);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.25);
}
.btn-minus:hover { background: rgba(239,68,68,0.22); box-shadow: 0 0 20px rgba(239,68,68,0.2); }

.btn-reset {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.3);
  font-size: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
}
.btn-reset:hover { background: rgba(255,255,255,0.09); }

.btn-plus {
  background: rgba(99,102,241,0.12);
  color: #818cf8;
  border: 1px solid rgba(99,102,241,0.25);
}
.btn-plus:hover { background: rgba(99,102,241,0.22); box-shadow: 0 0 20px rgba(99,102,241,0.2); }`;
    }
  }

  private getAppCode(componentName: string): string {
    return `import '@/styles/main.css';
import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="app-root">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
