"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ChatAssistant.module.css";

type Sender = "assistant" | "user";

interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: string;
}

interface LeadContext {
  business?: string;
  goal?: string;
  budget?: string;
  timeline?: string;
  name?: string;
  phone?: string;
  interestLevel: "cold" | "warm" | "hot";
}

const quickReplies = [
  "Lead generation ke liye kya best rahega?",
  "Mera budget 50k hai per month",
  "Main ecommerce brand run karta hoon",
  "3 hafton mein campaign launch karna hai",
  "Mujhe brand awareness badhani hai"
];

const initialMessage: Message = {
  id: "intro",
  sender: "assistant",
  text: "Namaste! Main GrowthPulse ka marketing guide hoon. Aap apni business situation share karo, main turant suggest karunga kaunsi digital marketing mix aapke liye sahi rahegi.",
  timestamp: formatNow()
};

function formatNow(): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function createMessage(sender: Sender, text: string): Message {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender,
    text,
    timestamp: formatNow()
  };
}

function sanitizeName(raw: string): string {
  return raw
    .replace(/[^a-zA-Z\s]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function detectBudget(text: string): string | undefined {
  const match = text.match(/(\b\d+(?:\.\d+)?\s*(?:k|lakh|lac|cr|crore|rs|inr|₹|usd|dollar)?\b)/i);
  if (!match) return undefined;
  const value = match[1]
    .replace(/inr|rs|usd|dollar/gi, "")
    .replace(/₹/g, "Rs ")
    .trim();
  return value.length > 0 ? value : undefined;
}

function detectPhone(text: string): string | undefined {
  const match = text.replace(/[-\s]/g, "").match(/\b(?:\+91)?\d{10}\b/);
  if (!match) return undefined;
  const phone = match[0].startsWith("+91") ? match[0].slice(3) : match[0];
  return phone;
}

function detectName(text: string): string | undefined {
  const match = text.match(/(?:mera naam|my name is|main|i am|this is)\s+([a-zA-Z\s]{2,})/i);
  if (!match) return undefined;
  return sanitizeName(match[1]);
}

function detectBusiness(text: string): string | undefined {
  const match = text.match(/(?:business|company|brand|agency|startup|store)\s*(?:hai|is|:)?\s*([a-zA-Z\s&]{3,})/i);
  if (match) {
    return match[1].trim();
  }
  if (/e-?commerce|online store|d2c/i.test(text)) {
    return "Ecommerce";
  }
  if (/real estate|property|builder/i.test(text)) {
    return "Real Estate";
  }
  if (/clinic|hospital|doctor|health|wellness/i.test(text)) {
    return "Healthcare";
  }
  if (/education|coaching|edtech|institute/i.test(text)) {
    return "Education";
  }
  if (/restaurant|cafe|food brand/i.test(text)) {
    return "F&B";
  }
  return undefined;
}

function detectGoal(text: string): string | undefined {
  if (/lead|sales|enquiry|signup|conversion/i.test(text)) {
    return "Lead Generation";
  }
  if (/brand|awareness|visibility|reach/i.test(text)) {
    return "Brand Awareness";
  }
  if (/traffic|website|visits|sessions/i.test(text)) {
    return "Website Traffic";
  }
  if (/app install|downloads|app users/i.test(text)) {
    return "App Installs";
  }
  if (/retention|repeat|loyalty/i.test(text)) {
    return "Retention & Loyalty";
  }
  return undefined;
}

function detectTimeline(text: string): string | undefined {
  if (/week|haft|7\s*din/i.test(text)) {
    return "1-2 Weeks";
  }
  if (/month|mahina|30\s*din/i.test(text)) {
    return "This Month";
  }
  if (/quarter|3\s*month|90\s*din/i.test(text)) {
    return "Next Quarter";
  }
  if (/asap|jaldi|immediately|urgent/i.test(text)) {
    return "ASAP";
  }
  return undefined;
}

function detectInterestLevel(text: string, current: LeadContext["interestLevel"]): LeadContext["interestLevel"] {
  const lower = text.toLowerCase();
  const hotKeywords = [
    "start kar",
    "let's start",
    "lets start",
    "go ahead",
    "ready",
    "interested",
    "sign me up",
    "proceed",
    "book",
    "call me",
    "talk to expert",
    "connect me",
    "move forward"
  ];

  if (hotKeywords.some((key) => lower.includes(key))) {
    return "hot";
  }

  if (current === "hot") return current;

  if (/budget|how much|plan share|proposal/i.test(lower)) {
    return "warm";
  }

  return current;
}

function getNextQuestion(context: LeadContext): string | undefined {
  if (!context.business) return "Aapka business ya brand kis industry mein kaam karta hai?";
  if (!context.goal) return "Primary objective kya hai? Leads, sales ya sirf awareness?";
  if (!context.budget) return "Approx monthly budget kitna socha hai?";
  if (!context.timeline) return "Campaign launch karne ka timeline bata den?";
  if (!context.name) return "Aapka naam kya likhu?";
  if (!context.phone) return "Contact number share karenge?";
  return undefined;
}

function craftServiceIdeas(context: LeadContext, latestUserText: string): string[] {
  const ideas = new Set<string>();
  const lower = latestUserText.toLowerCase();

  if (context.goal === "Lead Generation" || /lead|enquiry|conversion/i.test(lower)) {
    ideas.add("Google Ads search + high-intent landing page optimisations");
    ideas.add("Meta Ads retargeting funnel for warmer audiences");
  }

  if (context.goal === "Brand Awareness" || /brand|awareness|visibility/i.test(lower)) {
    ideas.add("Instagram Reels + influencer collab plan");
    ideas.add("YouTube discovery ads for reach");
  }

  if (context.business === "Ecommerce" || /e-?commerce|online store|shopping/i.test(lower)) {
    ideas.add("Performance Max campaigns with product feed optimisations");
  }

  if (/real estate|property|builder/i.test(lower) || context.business === "Real Estate") {
    ideas.add("Lead nurturing automation with WhatsApp follow-ups");
  }

  if (/clinic|hospital|doctor|health|wellness/i.test(lower) || context.business === "Healthcare") {
    ideas.add("Hyperlocal Google Ads + reputation management");
  }

  if (!ideas.size) {
    ideas.add("SEO content clusters + authority backlinks");
    ideas.add("Full-funnel Meta + Google Ads mix");
  }

  return Array.from(ideas).slice(0, 3);
}

function buildAssistantReply(
  updatedContext: LeadContext,
  updates: Partial<LeadContext>,
  userText: string
): string {
  if (updatedContext.interestLevel === "hot") {
    return "Main aapko hamare expert se connect kar raha hoon 😊";
  }

  const parts: string[] = [];

  if (updates.business) {
    parts.push(`Great! ${updates.business} ko scale karne ke liye main focused strategy banaunga.`);
  }

  if (updates.goal) {
    parts.push(`Samajh gaya ki aapka core goal ${updates.goal.toLowerCase()} hai.`);
  }

  if (updates.budget) {
    parts.push(`Budget ${updates.budget} note kar liya, iske andar best mix suggest karunga.`);
  }

  if (updates.timeline) {
    parts.push(`Timeline ${updates.timeline} rakhenge, accordingly launch plan banega.`);
  }

  if (updates.name) {
    parts.push(`Thank you ${updates.name}, aapka naam note kar liya.`);
  }

  if (updates.phone) {
    parts.push(`Contact ${updates.phone} save kar diya, team outreach ready rahegi.`);
  }

  const ideas = craftServiceIdeas(updatedContext, userText);
  if (ideas.length) {
    parts.push(`Mujhe lagta hai ye services aapke liye kaafi effective rahengi:\n• ${ideas.join("\n• ")}`);
  }

  const nextQuestion = getNextQuestion(updatedContext);
  if (nextQuestion) {
    parts.push(nextQuestion);
  } else if (updatedContext.interestLevel === "warm") {
    parts.push("Agar aap detailed roadmap dekhna chahte ho to bolo, main quick outline share kar deta hoon.");
  } else {
    parts.push("Aur kuch specifics share karna chaho to batao, main help karta rahunga.");
  }

  return parts.join("\n\n");
}

function summarizeLeadStatus(context: LeadContext): { label: string; value?: string }[] {
  return [
    { label: "Business", value: context.business },
    { label: "Goal", value: context.goal },
    { label: "Budget", value: context.budget },
    { label: "Timeline", value: context.timeline },
    { label: "Name", value: context.name },
    { label: "Phone", value: context.phone }
  ];
}

export default function ChatAssistant(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState<string>("");
  const [context, setContext] = useState<LeadContext>({ interestLevel: "cold" });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const leadStatus = useMemo(() => summarizeLeadStatus(context), [context]);

  const handleSend = (text: string): void => {
    if (!text.trim()) return;
    const userMessage = createMessage("user", text.trim());

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      let replyMessage: Message | null = null;
      setContext((prevContext) => {
        const latestContext: LeadContext = { ...prevContext };
        const updates: Partial<LeadContext> = {};

        if (!latestContext.business) {
          const business = detectBusiness(text);
          if (business) {
            updates.business = business;
            latestContext.business = business;
          }
        }

        if (!latestContext.goal) {
          const goal = detectGoal(text);
          if (goal) {
            updates.goal = goal;
            latestContext.goal = goal;
          }
        }

        if (!latestContext.budget) {
          const budget = detectBudget(text);
          if (budget) {
            updates.budget = budget;
            latestContext.budget = budget;
          }
        }

        if (!latestContext.timeline) {
          const timeline = detectTimeline(text);
          if (timeline) {
            updates.timeline = timeline;
            latestContext.timeline = timeline;
          }
        }

        if (!latestContext.name) {
          const name = detectName(text);
          if (name) {
            updates.name = name;
            latestContext.name = name;
          }
        }

        if (!latestContext.phone) {
          const phone = detectPhone(text);
          if (phone) {
            updates.phone = phone;
            latestContext.phone = phone;
          }
        }

        const interestLevel = detectInterestLevel(text, latestContext.interestLevel);
        if (interestLevel !== latestContext.interestLevel) {
          updates.interestLevel = interestLevel;
        }
        latestContext.interestLevel = interestLevel;

        replyMessage = createMessage(
          "assistant",
          buildAssistantReply(latestContext, updates, text)
        );

        return latestContext;
      });
      if (replyMessage) {
        setMessages((prev) => [...prev, replyMessage as Message]);
      }
    }, 250);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const currentInput = input;
    setInput("");
    handleSend(currentInput);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className={styles.container}>
      <div>
        <header className={styles.heading}>
          <span className={styles.eyebrow}>WhatsApp-style assistant</span>
          <h1 className={styles.title}>
            GrowthPulse <span className={styles.highlight}>Marketing Desk</span>
          </h1>
          <p className={styles.subtitle}>
            Polite Hinglish mein baat karke business goals samjhta hai, qualified leads capture karta hai aur right moment par human team ko handover karta hai.
          </p>
        </header>

        <section className={styles.chatCard}>
          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${
                  message.sender === "user"
                    ? styles.messageRowUser
                    : styles.messageRowAssistant
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    message.sender === "user" ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {message.text}
                  <div className={styles.timestamp}>{message.timestamp}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.inputBar} onSubmit={onSubmit}>
            <input
              className={styles.textInput}
              placeholder="Aap apna message yahan type karo..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </form>

          <div className={styles.quickReplies}>
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                className={styles.quickButton}
                onClick={() => handleSend(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarSection}>
          <span className={styles.sectionTitle}>Lead snapshot</span>
          <span className={styles.badge}>
            {context.interestLevel === "hot"
              ? "High Intent"
              : context.interestLevel === "warm"
              ? "Warm Lead"
              : "Exploring"}
          </span>
          {leadStatus.map((item) => (
            <div key={item.label} className={styles.leadCard}>
              <span className={styles.label}>{item.label}</span>
              <span className={item.value ? styles.value : styles.placeholder}>
                {item.value ?? "Pending"}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.sidebarSection}>
          <span className={styles.sectionTitle}>Conversation cues</span>
          <div className={styles.tipBox}>
            Friendly Hinglish tone maintain rakho, specific numbers aur goals share karoge to plan instant milega. Agar aap ready ho to bas bolo &ldquo;let&apos;s start&rdquo; aur main expert handover kar dunga.
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <span className={styles.sectionTitle}>Focus services</span>
          <div className={styles.pillList}>
            <span className={styles.pill}>SEO Sprints</span>
            <span className={styles.pill}>Meta Ads Funnels</span>
            <span className={styles.pill}>Google Ads Performance</span>
            <span className={styles.pill}>Social Media Playbooks</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
