'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function ToolBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep focus in editor
        onClick();
      }}
      className={`inline-flex items-center justify-center w-7 h-7 rounded text-sm transition-colors select-none
        ${active
          ? 'bg-emerald-700 text-white'
          : 'text-neutral-700 hover:bg-neutral-200'
        }`}
    >
      {children}
    </button>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider() {
  return <span className="w-px h-5 bg-neutral-300 mx-1 shrink-0" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write product description here...',
  minHeight = 180,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState('3');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffff00');

  // ── Sync external value → editor (only on mount or external change) ──────
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  // ── execCommand helper ────────────────────────────────────────────────────
  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateActiveFormats();
  }, []);

  // ── Track active formats ──────────────────────────────────────────────────
  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyFull: document.queryCommandState('justifyFull'),
    });
  }, []);

  const handleInput = useCallback(() => {
    isInternalUpdate.current = true;
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  const handleKeyUp = useCallback(() => {
    updateActiveFormats();
  }, [updateActiveFormats]);

  const handleMouseUp = useCallback(() => {
    updateActiveFormats();
  }, [updateActiveFormats]);

  // ── Font size ─────────────────────────────────────────────────────────────
  const applyFontSize = (val: string) => {
    setFontSize(val);
    exec('fontSize', val);
  };

  // ── Font family ───────────────────────────────────────────────────────────
  const applyFontFamily = (val: string) => {
    setFontFamily(val);
    exec('fontName', val);
  };

  // ── Text color ────────────────────────────────────────────────────────────
  const applyTextColor = (val: string) => {
    setTextColor(val);
    exec('foreColor', val);
  };

  // ── Background/Highlight color ────────────────────────────────────────────
  const applyBgColor = (val: string) => {
    setBgColor(val);
    exec('hiliteColor', val);
  };

  // ── Insert link ───────────────────────────────────────────────────────────
  const insertLink = () => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  };

  // ── Insert table ──────────────────────────────────────────────────────────
  const insertTable = () => {
    const rows = parseInt(window.prompt('Number of rows:', '3') || '3');
    const cols = parseInt(window.prompt('Number of columns:', '3') || '3');
    if (!rows || !cols) return;
    let html = '<table style="border-collapse:collapse;width:100%">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #d1d5db;padding:6px 10px;min-width:60px">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    exec('insertHTML', html);
  };

  // ── Clear formatting ──────────────────────────────────────────────────────
  const clearFormatting = () => {
    exec('removeFormat');
  };

  // ── Indent ────────────────────────────────────────────────────────────────
  const indent = () => exec('indent');
  const outdent = () => exec('outdent');

  // ── Show placeholder ──────────────────────────────────────────────────────
  const isEmpty = !value || value === '' || value === '<br>' || value === '<p><br></p>';

  return (
    <div className="rounded-xl border border-neutral-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700 bg-white shadow-sm">
      {/* ── Toolbar ── */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-2 py-1.5 flex flex-wrap items-center gap-0.5">

        {/* Font family */}
        <select
          value={fontFamily}
          onChange={(e) => applyFontFamily(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-7 px-1 text-xs rounded border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 mr-1"
          title="Font Family"
        >
          {['Arial','Georgia','Times New Roman','Courier New','Verdana','Trebuchet MS','Impact'].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-7 w-14 px-1 text-xs rounded border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 mr-1"
          title="Font Size"
        >
          <option value="1">8pt</option>
          <option value="2">10pt</option>
          <option value="3">12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
          <option value="6">24pt</option>
          <option value="7">36pt</option>
        </select>

        <Divider />

        {/* Bold, Italic, Underline, Strikethrough */}
        <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)" active={activeFormats.bold}>
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)" active={activeFormats.italic}>
          <em>I</em>
        </ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)" active={activeFormats.underline}>
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough" active={activeFormats.strikeThrough}>
          <span className="line-through">S</span>
        </ToolBtn>

        <Divider />

        {/* Text color */}
        <label title="Text Color" className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-neutral-200 cursor-pointer relative">
          <span className="text-xs font-bold" style={{ color: textColor }}>A</span>
          <span className="absolute bottom-0.5 left-1 right-1 h-1 rounded-sm" style={{ background: textColor }} />
          <input
            type="color"
            value={textColor}
            onChange={(e) => applyTextColor(e.target.value)}
            className="sr-only"
          />
        </label>

        {/* Highlight color */}
        <label title="Highlight Color" className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-neutral-200 cursor-pointer relative">
          <span className="text-xs font-bold px-0.5 rounded" style={{ background: bgColor }}>ab</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => applyBgColor(e.target.value)}
            className="sr-only"
          />
        </label>

        <Divider />

        {/* Alignment */}
        <ToolBtn onClick={() => exec('justifyLeft')} title="Align Left" active={activeFormats.justifyLeft}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5"/><rect x="1" y="5.5" width="10" height="1.5"/><rect x="1" y="9" width="14" height="1.5"/><rect x="1" y="12.5" width="10" height="1.5"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Center" active={activeFormats.justifyCenter}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5"/><rect x="3" y="5.5" width="10" height="1.5"/><rect x="1" y="9" width="14" height="1.5"/><rect x="3" y="12.5" width="10" height="1.5"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Align Right" active={activeFormats.justifyRight}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5"/><rect x="5" y="5.5" width="10" height="1.5"/><rect x="1" y="9" width="14" height="1.5"/><rect x="5" y="12.5" width="10" height="1.5"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyFull')} title="Justify" active={activeFormats.justifyFull}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5"/><rect x="1" y="5.5" width="14" height="1.5"/><rect x="1" y="9" width="14" height="1.5"/><rect x="1" y="12.5" width="14" height="1.5"/></svg>
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet List" active={activeFormats.insertUnorderedList}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><circle cx="2.5" cy="3.5" r="1.2"/><rect x="5" y="2.8" width="10" height="1.4"/><circle cx="2.5" cy="8" r="1.2"/><rect x="5" y="7.3" width="10" height="1.4"/><circle cx="2.5" cy="12.5" r="1.2"/><rect x="5" y="11.8" width="10" height="1.4"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered List" active={activeFormats.insertOrderedList}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><text x="0.5" y="5" fontSize="5" fontFamily="Arial">1.</text><rect x="5" y="2.8" width="10" height="1.4"/><text x="0.5" y="9.5" fontSize="5" fontFamily="Arial">2.</text><rect x="5" y="7.3" width="10" height="1.4"/><text x="0.5" y="14" fontSize="5" fontFamily="Arial">3.</text><rect x="5" y="11.8" width="10" height="1.4"/></svg>
        </ToolBtn>

        <Divider />

        {/* Indent / Outdent */}
        <ToolBtn onClick={outdent} title="Decrease Indent">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><polygon points="1,5 1,11 5,8"/><rect x="7" y="3" width="8" height="1.5"/><rect x="7" y="7.2" width="8" height="1.5"/><rect x="7" y="11.5" width="8" height="1.5"/></svg>
        </ToolBtn>
        <ToolBtn onClick={indent} title="Increase Indent">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><polygon points="1,8 5,5 5,11"/><rect x="7" y="3" width="8" height="1.5"/><rect x="7" y="7.2" width="8" height="1.5"/><rect x="7" y="11.5" width="8" height="1.5"/></svg>
        </ToolBtn>

        <Divider />

        {/* Superscript / Subscript */}
        <ToolBtn onClick={() => exec('superscript')} title="Superscript">
          <span className="text-xs">x<sup className="text-[8px]">2</sup></span>
        </ToolBtn>
        <ToolBtn onClick={() => exec('subscript')} title="Subscript">
          <span className="text-xs">x<sub className="text-[8px]">2</sub></span>
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn onClick={insertLink} title="Insert Link">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><path d="M6.5 10.5l-1.5 1.5a2.12 2.12 0 01-3-3l3-3a2.12 2.12 0 013 0l.7-.7a3.12 3.12 0 00-4.4 0l-3 3a3.12 3.12 0 004.4 4.4l1.5-1.5-.7-.7z"/><path d="M9.5 5.5l1.5-1.5a2.12 2.12 0 013 3l-3 3a2.12 2.12 0 01-3 0l-.7.7a3.12 3.12 0 004.4 0l3-3a3.12 3.12 0 00-4.4-4.4L9.5 5.5z"/></svg>
        </ToolBtn>

        {/* Table */}
        <ToolBtn onClick={insertTable} title="Insert Table">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="1" width="14" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/><line x1="1" y1="5.5" x2="15" y2="5.5" stroke="currentColor" strokeWidth="1.2"/><line x1="1" y1="10.5" x2="15" y2="10.5" stroke="currentColor" strokeWidth="1.2"/><line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" strokeWidth="1.2"/><line x1="10.5" y1="1" x2="10.5" y2="15" stroke="currentColor" strokeWidth="1.2"/></svg>
        </ToolBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn onClick={() => exec('undo')} title="Undo (Ctrl+Z)">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><path d="M3 8a5 5 0 105-5H5.5L7 1.5 4 4l3 2.5-1-1.5H8a3 3 0 11-3 3H3z"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Redo (Ctrl+Y)">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><path d="M13 8a5 5 0 10-5-5h2.5L9 1.5 12 4l-3 2.5 1-1.5H8a3 3 0 110 6h-2a5 5 0 005-3z"/></svg>
        </ToolBtn>

        <Divider />

        {/* Clear formatting */}
        <ToolBtn onClick={clearFormatting} title="Clear Formatting">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><path d="M3 2l10 12M2 14h7M6 2l5 6"/><path d="M4 2h8L9 9H4L1 14h3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><line x1="13" y1="11" x2="11" y2="15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </ToolBtn>

        {/* Heading shortcuts */}
        <Divider />
        <ToolBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1">
          <span className="text-xs font-bold">H1</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'p')} title="Normal Paragraph">
          <span className="text-xs">¶</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'blockquote')} title="Blockquote">
          <span className="text-xs">&ldquo;&rdquo;</span>
        </ToolBtn>
      </div>

      {/* ── Editable area ── */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute top-3 left-4 text-sm text-neutral-400 select-none">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          onFocus={updateActiveFormats}
          style={{ minHeight }}
          className="outline-none px-4 py-3 text-sm text-neutral-800 prose prose-sm max-w-none
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-1.5
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1
            [&_ul]:list-disc [&_ul]:pl-5
            [&_ol]:list-decimal [&_ol]:pl-5
            [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-600 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-600 [&_blockquote]:italic
            [&_table]:w-full [&_table]:border-collapse
            [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2
            [&_th]:border [&_th]:border-neutral-300 [&_th]:p-2 [&_th]:bg-neutral-100 [&_th]:font-semibold
            [&_a]:text-emerald-700 [&_a]:underline"
        />
      </div>

      {/* ── Status bar ── */}
      <div className="bg-neutral-50 border-t border-neutral-100 px-3 py-1 flex items-center justify-between text-[10px] text-neutral-400">
        <span>Rich Text Editor — Use toolbar above to format your description</span>
        <span>Keyboard shortcuts: Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline · Ctrl+Z Undo</span>
      </div>
    </div>
  );
}
