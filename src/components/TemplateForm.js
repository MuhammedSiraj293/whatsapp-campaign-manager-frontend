import React, { useState, useEffect, useRef } from "react";
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import TemplatePreview from "./TemplatePreview";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";

/* ─── Keyboard shortcut helper ─────────────────────────────────────────────── */
function wrapSelection(textarea, prefix, suffix) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const newValue =
    value.slice(0, start) + prefix + selected + suffix + value.slice(end);
  // Update native value so React's onChange fires
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  ).set;
  nativeInputValueSetter.call(textarea, newValue);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  // Reposition cursor
  const newCursor = start + prefix.length + selected.length + suffix.length;
  requestAnimationFrame(() => {
    textarea.setSelectionRange(
      selected ? start + prefix.length : start + prefix.length,
      selected ? start + prefix.length + selected.length : start + prefix.length
    );
    textarea.focus();
    // If wrapping selected text, place cursor after closing marker
    if (selected) {
      textarea.setSelectionRange(newCursor, newCursor);
    }
  });
}

/* ─── Formatting Toolbar Button ─────────────────────────────────────────────── */
const FmtBtn = ({ label, onClick, title, children }) => (
  <button
    type="button"
    title={title}
    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-300 bg-[#2a3a45] hover:bg-[#3a4f5c] hover:text-white rounded-md transition-all border border-transparent hover:border-[#4a6378] select-none"
    onClick={onClick}
  >
    {children || label}
  </button>
);

const TemplateForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  error,
  wabaId,
  authToken,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [language, setLanguage] = useState(initialData?.language || "en_US");
  const [category, setCategory] = useState(
    initialData?.category || "MARKETING"
  );

  const [headerType, setHeaderType] = useState("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerMediaUrl, setHeaderMediaUrl] = useState(null);
  const [headerFile, setHeaderFile] = useState(null);

  const [bodyText, setBodyText] = useState(initialData?.bodyText || "");
  const [variables, setVariables] = useState([]);

  const [footerText, setFooterText] = useState(initialData?.footerText || "");
  const [buttons, setButtons] = useState(initialData?.buttons || []);
  const [showBtnMenu, setShowBtnMenu] = useState(false);

  // --- Carousel support states ---
  const [isCarousel, setIsCarousel] = useState(false);
  const [carouselCards, setCarouselCards] = useState([
    { id: 1, file: null, previewUrl: "", body: "", buttonUrls: [] },
    { id: 2, file: null, previewUrl: "", body: "", buttonUrls: [] },
  ]);
  const [carouselButtons, setCarouselButtons] = useState([]);
  const [showCarouselBtnMenu, setShowCarouselBtnMenu] = useState(false);

  const bodyRef = useRef(null);
  const btnMenuRef = useRef(null);
  const carouselBtnMenuRef = useRef(null);

  // --- Automatic Category check for Carousel ---
  useEffect(() => {
    if (isCarousel) {
      setCategory("MARKETING");
    }
  }, [isCarousel]);

  // --- Close button menus on outside click ---
  useEffect(() => {
    const handler = (e) => {
      if (btnMenuRef.current && !btnMenuRef.current.contains(e.target)) {
        setShowBtnMenu(false);
      }
      if (carouselBtnMenuRef.current && !carouselBtnMenuRef.current.contains(e.target)) {
        setShowCarouselBtnMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Init from existing template ───────────────────────────────────────────
  useEffect(() => {
    if (initialData && initialData.components) {
      const carouselComp = initialData.components.find((c) => c.type === "CAROUSEL");
      if (carouselComp) {
        setIsCarousel(true);
        const bodyComp = initialData.components.find((c) => c.type === "BODY");
        setBodyText(bodyComp?.text || "");
        
        // Initialize cards
        const cardComps = carouselComp.cards.map((card, index) => {
          const header = card.components.find((cc) => cc.type === "HEADER");
          const body = card.components.find((cc) => cc.type === "BODY");
          const cardBtns = card.components.find((cc) => cc.type === "BUTTONS");
          
          let previewUrl = "";
          if (header?.example?.header_handle?.[0]) {
            previewUrl = header.example.header_handle[0];
          }
          
          return {
            id: index + 1,
            file: null,
            previewUrl: previewUrl,
            body: body?.text || "",
            buttonUrls: cardBtns?.buttons?.map((b) => b.url || "") || []
          };
        });
        setCarouselCards(cardComps);

        // Initialize global carousel buttons from first card
        const firstCardBtns = carouselComp.cards[0]?.components.find((cc) => cc.type === "BUTTONS");
        if (firstCardBtns) {
          setCarouselButtons(
            firstCardBtns.buttons.map((b) => ({
              type: b.type,
              text: b.text,
              url: b.url || ""
            }))
          );
        }
      } else {
        setIsCarousel(false);
        initialData.components.forEach((c) => {
          if (c.type === "HEADER") {
            setHeaderType(c.format);
            if (c.format === "TEXT") setHeaderText(c.text);
          }
          if (c.type === "BODY") setBodyText(c.text);
          if (c.type === "FOOTER") setFooterText(c.text);
          if (c.type === "BUTTONS") {
            setButtons(
              c.buttons.map((b) => ({
                type: b.type,
                text: b.text,
                url: b.url || "",
                phoneNumber: b.phone_number || "",
              }))
            );
          }
        });
      }
      setName(initialData.name);
      setCategory(initialData.category);
      setLanguage(initialData.language);
    }
  }, [initialData]);

  // ── Detect variables ──────────────────────────────────────────────────────
  useEffect(() => {
    const matches = bodyText.match(/{{\d+}}/g);
    if (matches) {
      const unique = [...new Set(matches)];
      setVariables((prev) =>
        unique.map((m) => prev.find((p) => p.key === m) || { key: m, type: "TEXT", sample: "" })
      );
    } else {
      setVariables([]);
    }
  }, [bodyText]);

  // ── Keyboard shortcut handler ─────────────────────────────────────────────
  const handleBodyKeyDown = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const ta = bodyRef.current;
    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault();
        wrapSelection(ta, "*", "*");
        break;
      case "i":
        e.preventDefault();
        wrapSelection(ta, "_", "_");
        break;
      case "u": // strikethrough (no underline in WA)
        e.preventDefault();
        wrapSelection(ta, "~", "~");
        break;
      case "m": // monospace
        e.preventDefault();
        wrapSelection(ta, "```", "```");
        break;
      default:
        break;
    }
  };

  // ── Button handlers ───────────────────────────────────────────────────────
  const handleAddButton = (type) => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type, text: "", url: "", phoneNumber: "" }]);
    setShowBtnMenu(false);
  };
  const handleRemoveButton = (i) => setButtons(buttons.filter((_, idx) => idx !== i));
  const handleButtonChange = (i, field, val) => {
    const nb = [...buttons];
    nb[i][field] = val;
    setButtons(nb);
  };
  const handleVariableChange = (key, field, val) =>
    setVariables((prev) => prev.map((v) => (v.key === key ? { ...v, [field]: val } : v)));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderFile(file);
      setHeaderMediaUrl(URL.createObjectURL(file));
    }
  };

  // --- Carousel card handlers ---
  const handleAddCard = () => {
    if (carouselCards.length >= 10) return;
    setCarouselCards([
      ...carouselCards,
      {
        id: Date.now(),
        file: null,
        previewUrl: "",
        body: "",
        buttonUrls: carouselButtons.map(() => "")
      }
    ]);
  };
  const handleRemoveCard = (id) => {
    if (carouselCards.length <= 2) return;
    setCarouselCards(carouselCards.filter((c) => c.id !== id));
  };
  const handleCardFileChange = (idx, file) => {
    const newCards = [...carouselCards];
    newCards[idx].file = file;
    newCards[idx].previewUrl = file ? URL.createObjectURL(file) : "";
    setCarouselCards(newCards);
  };
  const handleCardBodyChange = (idx, text) => {
    const newCards = [...carouselCards];
    newCards[idx].body = text;
    setCarouselCards(newCards);
  };
  const handleCardButtonUrlChange = (cardIdx, btnIdx, val) => {
    const newCards = [...carouselCards];
    newCards[cardIdx].buttonUrls[btnIdx] = val;
    setCarouselCards(newCards);
  };

  // --- Carousel global buttons handlers ---
  const handleAddCarouselButton = (type) => {
    if (carouselButtons.length >= 2) return;
    const newButtons = [...carouselButtons, { type, text: "", url: "" }];
    setCarouselButtons(newButtons);
    setCarouselCards(
      carouselCards.map((c) => ({
        ...c,
        buttonUrls: [...(c.buttonUrls || []), ""]
      }))
    );
    setShowCarouselBtnMenu(false);
  };
  const handleRemoveCarouselButton = (btnIdx) => {
    setCarouselButtons(carouselButtons.filter((_, idx) => idx !== btnIdx));
    setCarouselCards(
      carouselCards.map((c) => ({
        ...c,
        buttonUrls: (c.buttonUrls || []).filter((_, idx) => idx !== btnIdx)
      }))
    );
  };
  const handleCarouselButtonChange = (btnIdx, field, val) => {
    const newButtons = [...carouselButtons];
    newButtons[btnIdx][field] = val;
    setCarouselButtons(newButtons);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (isCarousel) {
      if (carouselCards.some((c) => !c.file && !c.previewUrl)) {
        alert("Please upload an image for every carousel card.");
        return;
      }
      if (carouselCards.some((c) => !c.body.trim())) {
        alert("Please enter a description for every carousel card.");
        return;
      }

      try {
        const cardsComponents = await Promise.all(
          carouselCards.map(async (card, idx) => {
            let handle = "";
            if (card.file) {
              const formData = new FormData();
              formData.append("file", card.file);
              formData.append("wabaId", wabaId);
              const uploadRes = await axios.post(
                `${API_URL}/api/media/upload-template-media`,
                formData,
                {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              handle = uploadRes.data?.handle;
            } else if (card.previewUrl && card.previewUrl.startsWith("http")) {
              // Existing card image was kept. Call the backend to download it and get a Meta handle automatically
              const uploadRes = await axios.post(
                `${API_URL}/api/media/upload-template-media`,
                {
                  wabaId,
                  url: card.previewUrl,
                },
                {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                  },
                }
              );
              handle = uploadRes.data?.handle;
            } else {
              handle = card.previewUrl;
            }

            const parseTemplateUrl = (fullUrl) => {
              try {
                const urlObj = new URL(fullUrl);
                const origin = urlObj.origin + "/";
                const suffix = urlObj.pathname.substring(1) + urlObj.search + urlObj.hash;
                return {
                  baseUrl: origin + "{{1}}",
                  suffix: suffix || "link"
                };
              } catch (e) {
                return {
                  baseUrl: "https://thecapitalavenue.com/{{1}}",
                  suffix: fullUrl || "link"
                };
              }
            };

            return {
              components: [
                {
                  type: "HEADER",
                  format: "IMAGE",
                  example: {
                    header_handle: [handle],
                  },
                },
                {
                  type: "BODY",
                  text: card.body,
                },
                ...(carouselButtons.length > 0
                  ? [
                      {
                        type: "BUTTONS",
                        buttons: carouselButtons.map((btn, btnIdx) => {
                          if (btn.type === "URL") {
                            const cardUrl = card.buttonUrls[btnIdx] || btn.url || "";
                            const parsed = parseTemplateUrl(cardUrl);
                            return {
                              type: "URL",
                              text: btn.text,
                              url: parsed.baseUrl,
                              example: [parsed.suffix],
                            };
                          }
                          return {
                            type: "QUICK_REPLY",
                            text: btn.text,
                          };
                        }),
                      },
                    ]
                  : []),
              ],
            };
          })
        );

        const components = [
          {
            type: "BODY",
            text: bodyText || "Explore our latest listings!",
          },
          {
            type: "CAROUSEL",
            cards: cardsComponents,
          },
        ];

        onSubmit({ name, category: "MARKETING", language, components });
      } catch (err) {
        console.error("Failed uploading carousel media:", err);
        alert("Failed to upload card media. Please check your connection and try again.");
      }
      return;
    }

    const components = [];

    if (headerType !== "NONE") {
      const headerComp = { type: "HEADER", format: headerType };
      if (headerType === "TEXT") headerComp.text = headerText;

      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType)) {
        if (headerFile) {
          try {
            const formData = new FormData();
            formData.append("file", headerFile);
            formData.append("wabaId", wabaId);
            const uploadRes = await axios.post(
              `${API_URL}/api/media/upload-template-media`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            if (uploadRes.data?.handle) {
              headerComp.example = { header_handle: [uploadRes.data.handle] };
            }
          } catch (err) {
            alert("Failed to upload media header. Please try again.");
            return;
          }
        }
      }
      components.push(headerComp);
    }

    const bodyComp = { type: "BODY", text: bodyText };
    if (variables.length > 0)
      bodyComp.example = { body_text: [variables.map((v) => v.sample)] };
    components.push(bodyComp);

    if (footerText) components.push({ type: "FOOTER", text: footerText });

    if (buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons.map((btn) => {
          if (btn.type === "QUICK_REPLY") return { type: "QUICK_REPLY", text: btn.text };
          if (btn.type === "URL") return { type: "URL", text: btn.text, url: btn.url };
          if (btn.type === "PHONE_NUMBER")
            return { type: "PHONE_NUMBER", text: btn.text, phone_number: btn.phoneNumber };
          return null;
        }),
      });
    }

    onSubmit({ name, category, language, components });
  };

  // ── Insert formatting from toolbar ────────────────────────────────────────
  const applyFormat = (prefix, suffix) => {
    if (bodyRef.current) wrapSelection(bodyRef.current, prefix, suffix);
  };

  const insertVariable = () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const tag = ` {{${variables.length + 1}}}`;
    const newVal = ta.value.slice(0, pos) + tag + ta.value.slice(pos);
    const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeSet.call(ta, newVal);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    requestAnimationFrame(() => {
      ta.setSelectionRange(pos + tag.length, pos + tag.length);
      ta.focus();
    });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0f1923] text-gray-100 font-sans">
      {/* ── TOP HEADER ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#111c25] to-[#182634] px-6 py-4 border-b border-[#1e3040] flex justify-between items-center shadow-lg">
        <div>
          <div className="text-lg font-bold text-white tracking-wide">
            {initialData ? name : "New Template"}
          </div>
          <div className="text-xs text-[#6e9ab0] mt-0.5 flex gap-2">
            <span className="bg-[#1e3040] px-2 py-0.5 rounded-full">{category}</span>
            <span className="bg-[#1e3040] px-2 py-0.5 rounded-full">{language}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#2d4557] transition-all"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-6 py-2 text-sm rounded-lg font-semibold bg-gradient-to-r from-[#0c8ce9] to-[#0a7ac9] hover:from-[#0a7ac9] hover:to-[#0868ad] text-white shadow-lg shadow-blue-900/40 transition-all border border-blue-700/30 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={handleFormSubmit}
            disabled={loading}
          >
            {loading ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto flex gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* ── CARD: Name & Language ──────────────────────────────────── */}
            <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
              <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040]">
                <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                  Template Identity
                </h3>
              </div>
              <div className="p-5 flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f9ec0] mb-1.5">
                    Template Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all"
                      placeholder="template_name"
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                      disabled={!!initialData}
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-gray-600">{name.length}/512</span>
                  </div>
                </div>
                <div className="w-44">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f9ec0] mb-1.5">
                    Language
                  </label>
                  <select
                    className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all appearance-none"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={!!initialData}
                  >
                    <option value="en_US">English (US)</option>
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                <div className="w-44">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f9ec0] mb-1.5">
                    Category
                  </label>
                  <select
                    className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isCarousel}
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
                <div className="w-44 flex flex-col justify-end pb-3">
                  <label className="inline-flex items-center text-xs font-semibold text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="form-checkbox bg-[#0f1923] border-[#1e3040] rounded text-[#0c8ce9] focus:ring-0 mr-2 w-4 h-4"
                      checked={isCarousel}
                      onChange={(e) => {
                        setIsCarousel(e.target.checked);
                        if (e.target.checked) setCategory("MARKETING");
                      }}
                      disabled={!!initialData}
                    />
                    Carousel Layout
                  </label>
                </div>
              </div>
            </div>

            {!isCarousel ? (
              <>
                {/* ── CARD: Header ──────────────────────────────────────────────── */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                      Header <span className="text-gray-600 font-normal normal-case ml-1">• Optional</span>
                    </h3>
                    <select
                      className="bg-[#1a2d3d] border border-[#1e3040] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0c8ce9] transition-all"
                      value={headerType}
                      onChange={(e) => { setHeaderType(e.target.value); setHeaderFile(null); setHeaderMediaUrl(null); }}
                    >
                      <option value="NONE">None</option>
                      <option value="TEXT">Text</option>
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="LOCATION">Location</option>
                    </select>
                  </div>
                  <div className="p-5">
                    {headerType === "NONE" && (
                      <p className="text-xs text-gray-600 italic">No header selected.</p>
                    )}
                    {headerType === "TEXT" && (
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all"
                          placeholder="Enter header text (max 60 chars)…"
                          value={headerText}
                          onChange={(e) => setHeaderText(e.target.value)}
                          maxLength={60}
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-gray-600">{headerText.length}/60</span>
                      </div>
                    )}
                    {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
                      <div className="border-2 border-dashed border-[#1e3040] hover:border-[#0c8ce9]/40 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group">
                        <div className="w-12 h-12 rounded-full bg-[#0f1923] flex items-center justify-center mb-3 group-hover:bg-[#0c8ce9]/10 transition-all">
                          {headerType === "IMAGE" && <PhotoIcon className="w-6 h-6 text-[#0c8ce9]" />}
                          {headerType === "VIDEO" && <VideoCameraIcon className="w-6 h-6 text-[#0c8ce9]" />}
                          {headerType === "DOCUMENT" && <DocumentTextIcon className="w-6 h-6 text-[#0c8ce9]" />}
                        </div>
                        <div className="text-sm font-semibold text-gray-300 mb-1">
                          {headerFile ? headerFile.name : `Upload ${headerType.toLowerCase()}`}
                        </div>
                        <div className="text-xs text-gray-600 mb-4">
                          {headerType === "IMAGE" ? "JPG, PNG, WebP" : headerType === "VIDEO" ? "MP4, 3GP" : "PDF"}
                        </div>
                        <label className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg bg-[#0c8ce9]/10 hover:bg-[#0c8ce9]/20 text-[#0c8ce9] border border-[#0c8ce9]/30 transition-all">
                          Choose File
                          <input type="file" className="hidden" accept="image/*,video/*,application/pdf" onChange={handleFileChange} />
                        </label>
                        {headerFile && (
                          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                            <span>✓</span> {headerFile.name}
                          </div>
                        )}
                      </div>
                    )}
                    {headerType === "LOCATION" && (
                      <div className="bg-[#0f1923] rounded-lg p-4 text-center text-xs text-gray-500 border border-[#1e3040]">
                        📍 Location header — no file needed
                      </div>
                    )}
                  </div>
                </div>

                {/* ── CARD: Body ────────────────────────────────────────────────── */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040]">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">Body</h3>
                  </div>
                  <div className="p-5">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-[#0f1923] rounded-lg border border-[#1e3040]">
                      <FmtBtn title="Bold (Ctrl+B)" onClick={() => applyFormat("*", "*")}>
                        <span className="font-bold text-sm">B</span>
                      </FmtBtn>
                      <FmtBtn title="Italic (Ctrl+I)" onClick={() => applyFormat("_", "_")}>
                        <span className="italic text-sm">I</span>
                      </FmtBtn>
                      <FmtBtn title="Strikethrough (Ctrl+U)" onClick={() => applyFormat("~", "~")}>
                        <span className="line-through text-sm">S</span>
                      </FmtBtn>
                      <FmtBtn title="Monospace (Ctrl+M)" onClick={() => applyFormat("```", "```")}>
                        <span className="font-mono text-sm">{"<>"}</span>
                      </FmtBtn>
                      <div className="w-px h-6 bg-[#1e3040] self-center mx-1" />
                      <FmtBtn title="Insert variable" onClick={insertVariable}>
                        <PlusIcon className="w-3 h-3" />
                        <span>Variable</span>
                      </FmtBtn>
                      <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-600">
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+B</kbd> Bold
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+I</kbd> Italic
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+U</kbd> Strike
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+M</kbd> Mono
                      </div>
                    </div>

                    <textarea
                      ref={bodyRef}
                      className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all resize-none leading-relaxed h-40 font-mono"
                      placeholder="Type your message here…&#10;Use *bold*, _italic_, ~strikethrough~, ```monospace```"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      onKeyDown={handleBodyKeyDown}
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] ${bodyText.length > 900 ? "text-amber-400" : "text-gray-600"}`}>
                        {bodyText.length}/1024
                      </span>
                    </div>

                    {/* Variable Samples */}
                    {variables.length > 0 && (
                      <div className="mt-4 bg-[#0f1923] rounded-lg border border-[#1e3040] p-4">
                        <h4 className="text-[10px] font-bold text-[#5f9ec0] uppercase tracking-widest mb-3">
                          Variable Samples
                        </h4>
                        <div className="space-y-2">
                          {variables.map((v) => (
                            <div key={v.key} className="flex gap-3 items-center">
                              <div className="w-12 text-center font-mono text-xs text-[#0c8ce9] bg-[#0c8ce9]/10 border border-[#0c8ce9]/20 px-2 py-1.5 rounded">
                                {v.key}
                              </div>
                              <input
                                type="text"
                                className="flex-1 bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] transition-all"
                                placeholder={`Sample for ${v.key}`}
                                value={v.sample}
                                onChange={(e) => handleVariableChange(v.key, "sample", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── CARD: Footer ─────────────────────────────────────────────── */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040]">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                      Footer <span className="text-gray-600 font-normal normal-case ml-1">• Optional</span>
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all"
                        placeholder="e.g. Reply STOP to unsubscribe"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        maxLength={60}
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-gray-600">{footerText.length}/60</span>
                    </div>
                  </div>
                </div>

                {/* ── CARD: Buttons ────────────────────────────────────────────── */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                      Buttons <span className="text-gray-600 font-normal normal-case ml-1">• Optional</span>
                    </h3>
                    {buttons.length < 3 && (
                      <div className="relative" ref={btnMenuRef}>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0c8ce9]/10 hover:bg-[#0c8ce9]/20 text-[#0c8ce9] border border-[#0c8ce9]/30 transition-all flex items-center gap-1"
                          onClick={() => setShowBtnMenu((v) => !v)}
                        >
                          <PlusIcon className="w-3.5 h-3.5" /> Add Button
                        </button>
                        {showBtnMenu && (
                          <div className="absolute right-0 top-full mt-1 bg-[#131f2b] border border-[#1e3040] rounded-xl shadow-xl z-50 w-52 overflow-hidden">
                            {["QUICK_REPLY", "URL", "PHONE_NUMBER"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#0c8ce9]/10 hover:text-white transition-all"
                                onClick={() => handleAddButton(t)}
                              >
                                {t === "QUICK_REPLY" ? "Quick Reply" : t === "URL" ? "Visit Website (URL)" : "Call Phone Number"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    {buttons.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">No buttons added yet.</p>
                    ) : (
                      buttons.map((btn, idx) => (
                        <div key={idx} className="bg-[#0f1923] border border-[#1e3040] rounded-xl p-4 relative group">
                          <button
                            type="button"
                            className="absolute top-3 right-3 text-gray-600 hover:text-red-400 transition-colors"
                            onClick={() => handleRemoveButton(idx)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0c8ce9]/10 border border-[#0c8ce9]/20 text-[10px] text-[#0c8ce9] font-bold uppercase mb-3">
                            {btn.type.replace("_", " ")}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                Button Text
                              </label>
                              <input
                                type="text"
                                className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] transition-all"
                                placeholder="Button label"
                                value={btn.text}
                                onChange={(e) => handleButtonChange(idx, "text", e.target.value)}
                              />
                            </div>
                            {btn.type === "URL" && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                  Website URL
                                </label>
                                <input
                                  type="url"
                                  className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] transition-all"
                                  placeholder="https://…"
                                  value={btn.url}
                                  onChange={(e) => handleButtonChange(idx, "url", e.target.value)}
                                />
                              </div>
                            )}
                            {btn.type === "PHONE_NUMBER" && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] transition-all"
                                  placeholder="+1 234 567 8900"
                                  value={btn.phoneNumber}
                                  onChange={(e) => handleButtonChange(idx, "phoneNumber", e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ── CAROUSEL BUILDER ── */}
                {/* Intro Message Body */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040]">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                      Carousel Intro Body Text
                    </h3>
                  </div>
                  <div className="p-5">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-[#0f1923] rounded-lg border border-[#1e3040]">
                      <FmtBtn title="Bold (Ctrl+B)" onClick={() => applyFormat("*", "*")}>
                        <span className="font-bold text-sm">B</span>
                      </FmtBtn>
                      <FmtBtn title="Italic (Ctrl+I)" onClick={() => applyFormat("_", "_")}>
                        <span className="italic text-sm">I</span>
                      </FmtBtn>
                      <FmtBtn title="Strikethrough (Ctrl+U)" onClick={() => applyFormat("~", "~")}>
                        <span className="line-through text-sm">S</span>
                      </FmtBtn>
                      <FmtBtn title="Monospace (Ctrl+M)" onClick={() => applyFormat("```", "```")}>
                        <span className="font-mono text-sm">{"<>"}</span>
                      </FmtBtn>
                      <div className="w-px h-6 bg-[#1e3040] self-center mx-1" />
                      <FmtBtn title="Insert variable" onClick={insertVariable}>
                        <PlusIcon className="w-3 h-3" />
                        <span>Variable</span>
                      </FmtBtn>
                      <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-600">
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+B</kbd> Bold
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+I</kbd> Italic
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+U</kbd> Strike
                        <kbd className="px-1.5 py-0.5 bg-[#1e3040] rounded text-gray-500 font-mono">Ctrl+M</kbd> Mono
                      </div>
                    </div>

                    <textarea
                      ref={bodyRef}
                      className="w-full bg-[#0f1923] border border-[#1e3040] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9] focus:ring-1 focus:ring-[#0c8ce9]/40 transition-all resize-none leading-relaxed h-28 font-mono"
                      placeholder="Type your message header intro text here..."
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      onKeyDown={handleBodyKeyDown}
                    />
                    <div className="flex justify-end mt-1 text-[10px] text-gray-600">
                      {bodyText.length}/1024
                    </div>
                  </div>
                </div>

                {/* Global Carousel Button Settings */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                      Card Buttons <span className="text-gray-600 font-normal normal-case ml-1">• Max 2</span>
                    </h3>
                    {carouselButtons.length < 2 && (
                      <div className="relative" ref={carouselBtnMenuRef}>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0c8ce9]/10 hover:bg-[#0c8ce9]/20 text-[#0c8ce9] border border-[#0c8ce9]/30 transition-all flex items-center gap-1"
                          onClick={() => setShowCarouselBtnMenu((v) => !v)}
                        >
                          <PlusIcon className="w-3.5 h-3.5" /> Add Card Button
                        </button>
                        {showCarouselBtnMenu && (
                          <div className="absolute right-0 top-full mt-1 bg-[#131f2b] border border-[#1e3040] rounded-xl shadow-xl z-50 w-52 overflow-hidden">
                            {["QUICK_REPLY", "URL"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#0c8ce9]/10 hover:text-white transition-all"
                                onClick={() => handleAddCarouselButton(t)}
                              >
                                {t === "QUICK_REPLY" ? "Quick Reply" : "Visit Website (URL)"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    {carouselButtons.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">No card buttons added yet.</p>
                    ) : (
                      carouselButtons.map((btn, idx) => (
                        <div key={idx} className="bg-[#0f1923] border border-[#1e3040] rounded-xl p-4 relative">
                          <button
                            type="button"
                            className="absolute top-3 right-3 text-gray-600 hover:text-red-400"
                            onClick={() => handleRemoveCarouselButton(idx)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0c8ce9]/10 border border-[#0c8ce9]/20 text-[10px] text-[#0c8ce9] font-bold uppercase mb-3">
                            {btn.type.replace("_", " ")}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                Button Label
                              </label>
                              <input
                                type="text"
                                className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9]"
                                placeholder="Button label text"
                                value={btn.text}
                                onChange={(e) => handleCarouselButtonChange(idx, "text", e.target.value)}
                              />
                            </div>
                            {btn.type === "URL" && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                  Default / Base URL
                                </label>
                                <input
                                  type="url"
                                  className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9]"
                                  placeholder="https://..."
                                  value={btn.url}
                                  onChange={(e) => handleCarouselButtonChange(idx, "url", e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Carousel Cards list */}
                <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-md overflow-hidden">
                  <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                      Cards List <span className="text-gray-600 font-normal normal-case ml-1">• 2 to 10 cards</span>
                    </h3>
                    {carouselCards.length < 10 && (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0c8ce9]/10 hover:bg-[#0c8ce9]/20 text-[#0c8ce9] border border-[#0c8ce9]/30 transition-all flex items-center gap-1"
                        onClick={handleAddCard}
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> Add Card
                      </button>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    {carouselCards.map((card, cardIdx) => (
                      <div key={card.id} className="bg-[#0f1923] border border-[#1e3040] rounded-xl p-4 relative">
                        {carouselCards.length > 2 && (
                          <button
                            type="button"
                            className="absolute top-3 right-3 text-gray-600 hover:text-red-400"
                            onClick={() => handleRemoveCard(card.id)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                        <div className="text-xs font-bold text-[#5f9ec0] tracking-wide mb-3">
                          Card #{cardIdx + 1}
                        </div>
                        <div className="space-y-3">
                          {/* Image upload */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                              Card Media Header (Image)
                            </label>
                            <div className="border-2 border-dashed border-[#1e3040] hover:border-[#0c8ce9]/40 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all">
                              {card.previewUrl ? (
                                <div className="w-full max-w-[200px] h-24 rounded overflow-hidden relative">
                                  <img src={card.previewUrl} alt={`Card ${cardIdx + 1} preview`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                                    onClick={() => handleCardFileChange(cardIdx, null)}
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <PhotoIcon className="w-6 h-6 text-[#0c8ce9] mb-1" />
                                  <span className="text-[10px] text-gray-400 mb-2">Upload image (JPEG/PNG)</span>
                                  <label className="cursor-pointer px-3 py-1 text-[10px] font-semibold rounded bg-[#0c8ce9]/10 hover:bg-[#0c8ce9]/20 text-[#0c8ce9] border border-[#0c8ce9]/30">
                                    Choose Image
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => handleCardFileChange(cardIdx, e.target.files[0])}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                              Card Body Text (Max 160 characters)
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9]"
                              placeholder="Enter details..."
                              value={card.body}
                              maxLength={160}
                              onChange={(e) => handleCardBodyChange(cardIdx, e.target.value)}
                            />
                          </div>

                          {/* Card URL input buttons */}
                          {carouselButtons.map((btn, btnIdx) => {
                            if (btn.type !== "URL") return null;
                            return (
                              <div key={btnIdx}>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                  URL for Button "{btn.text || 'Link'}"
                                </label>
                                <input
                                  type="url"
                                  className="w-full bg-[#131f2b] border border-[#1e3040] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0c8ce9]"
                                  placeholder="https://..."
                                  value={card.buttonUrls[btnIdx] || ""}
                                  onChange={(e) => handleCardButtonUrlChange(cardIdx, btnIdx, e.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>{/* end left column */}

          {/* ── RIGHT COLUMN: Preview ────────────────────────────────────── */}
          <div className="w-[340px] shrink-0 sticky top-4 self-start">
            <div className="bg-[#131f2b] rounded-xl border border-[#1e3040] shadow-xl overflow-hidden">
              <div className="px-5 py-3 bg-[#0f1923] border-b border-[#1e3040]">
                <h3 className="text-xs font-bold text-[#5f9ec0] uppercase tracking-widest">
                  Live Preview
                </h3>
              </div>
              <div className="p-4">
                <TemplatePreview
                  headerType={headerType}
                  headerText={headerText}
                  headerMediaUrl={headerMediaUrl}
                  bodyText={bodyText}
                  footerText={footerText}
                  buttons={buttons}
                />
              </div>
              <div className="px-4 pb-4 text-[10px] text-gray-600 text-center">
                Approximate preview. Actual appearance may vary by device.
              </div>
            </div>

            {/* Shortcut cheatsheet */}
            <div className="mt-4 bg-[#131f2b] rounded-xl border border-[#1e3040] p-4">
              <h4 className="text-[10px] font-bold text-[#5f9ec0] uppercase tracking-widest mb-3">
                Formatting Shortcuts
              </h4>
              <div className="space-y-2">
                {[
                  ["Ctrl+B", "*text*", "Bold"],
                  ["Ctrl+I", "_text_", "Italic"],
                  ["Ctrl+U", "~text~", "Strikethrough"],
                  ["Ctrl+M", "```text```", "Monospace"],
                ].map(([key, syntax, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <kbd className="px-2 py-0.5 bg-[#0f1923] border border-[#1e3040] rounded text-[10px] text-gray-400 font-mono">
                      {key}
                    </kbd>
                    <code className="text-[10px] text-[#0c8ce9]">{syntax}</code>
                    <span className="text-[10px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ERROR TOAST ────────────────────────────────────────────────────── */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-900/90 border border-red-700 text-white text-sm rounded-xl px-5 py-3 shadow-2xl flex items-center gap-2 z-50">
          <span className="text-red-300">⚠</span> {error}
        </div>
      )}
    </div>
  );
};

export default TemplateForm;
