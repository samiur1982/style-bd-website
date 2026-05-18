'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { useState, useEffect, useCallback } from 'react'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Code2,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Heading1, Heading2, Heading3, Quote,
  Undo, Redo, Highlighter, RemoveFormatting, Eye, EyeOff
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  label?: string
  rows?: number
  className?: string
}

function ToolbarButton({
  onClick, active = false, title, children, disabled = false
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center min-w-[28px] min-h-[28px] 
        ${active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 self-center flex-shrink-0" />
}

export default function RichTextEditor({
  value, onChange, placeholder = 'Write something...', label, rows = 5, className = ''
}: RichTextEditorProps) {
  const [htmlMode, setHtmlMode] = useState(false)
  const [rawHtml, setRawHtml] = useState(value || '')
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2 min-h-[120px]',
        style: `min-height: ${rows * 24}px`,
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const clean = html === '<p></p>' ? '' : html
      onChange(clean)
      setRawHtml(clean)
    },
    immediatelyRender: false,
  })

  // Sync external value changes into editor
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value && !editor.isFocused) {
      editor.commands.setContent(value || '')
      setRawHtml(value || '')
    }
  }, [value, editor])

  // Switch modes
  const switchToHtml = useCallback(() => {
    if (!editor) return
    setRawHtml(editor.getHTML() === '<p></p>' ? '' : editor.getHTML())
    setHtmlMode(true)
  }, [editor])

  const switchToVisual = useCallback(() => {
    if (!editor) return
    editor.commands.setContent(rawHtml || '')
    onChange(rawHtml)
    setHtmlMode(false)
  }, [editor, rawHtml, onChange])

  const addLink = () => {
    if (!editor) return
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  if (!editor) return null

  return (
    <div className={`flex flex-col rounded-xl border border-border overflow-hidden bg-card focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40">

        {/* History */}
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Text formatting */}
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Inline Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Code Block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton title="Add Link" active={editor.isActive('link')} onClick={() => setShowLinkInput(v => !v)}>
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Remove Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <RemoveFormatting className="w-3.5 h-3.5" />
        </ToolbarButton>

        {/* Spacer */}
        <div className="flex-1" />

        {/* HTML / Visual toggle */}
        <button
          type="button"
          onClick={htmlMode ? switchToVisual : switchToHtml}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all ml-1"
          title={htmlMode ? 'Switch to Visual editor' : 'Switch to HTML mode'}
        >
          {htmlMode ? <><Eye className="w-3 h-3" /> Visual</> : <><Code2 className="w-3 h-3" /> HTML</>}
        </button>
      </div>

      {/* Link URL input */}
      {showLinkInput && !htmlMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-border">
          <LinkIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLink()}
            placeholder="https://example.com"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button type="button" onClick={addLink} className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Add
          </button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="text-muted-foreground hover:text-foreground text-xs">
            Cancel
          </button>
        </div>
      )}

      {/* Editor body */}
      {htmlMode ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
            <Code2 className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">HTML Source Mode — You can write raw HTML &amp; inline CSS here</span>
          </div>
          <textarea
            value={rawHtml}
            onChange={e => { setRawHtml(e.target.value); onChange(e.target.value) }}
            className="flex-1 w-full bg-[#0d1117] text-emerald-400 font-mono text-xs px-4 py-3 outline-none resize-none"
            style={{ minHeight: `${Math.max(rows * 24, 160)}px` }}
            placeholder="<p>Write <strong>HTML</strong> here with inline styles...</p>"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="rich-editor-content relative">
          <EditorContent editor={editor} />
          {!editor.getText() && (
            <div className="absolute top-2 left-3 text-muted-foreground text-sm pointer-events-none select-none">
              {placeholder}
            </div>
          )}
        </div>
      )}

      {/* Footer: char count & mode indicator */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/30">
        <span className="text-[10px] text-muted-foreground">
          {editor.storage?.characterCount?.characters?.() ?? editor.getText().length} chars
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${htmlMode ? 'text-amber-600' : 'text-primary'}`}>
          {htmlMode ? '⚙ HTML Mode' : '✏ Visual Mode'}
        </span>
      </div>

      {/* Global prose styles */}
      <style>{`
        .rich-editor-content .ProseMirror {
          padding: 12px;
          min-height: ${rows * 24}px;
          outline: none;
          color: hsl(var(--foreground));
        }
        .rich-editor-content .ProseMirror h1 { font-size: 1.5em; font-weight: 800; margin: 0.5em 0; }
        .rich-editor-content .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; }
        .rich-editor-content .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.4em 0; }
        .rich-editor-content .ProseMirror p { margin: 0.3em 0; line-height: 1.6; font-size: 0.875rem; }
        .rich-editor-content .ProseMirror strong { font-weight: 700; }
        .rich-editor-content .ProseMirror em { font-style: italic; }
        .rich-editor-content .ProseMirror u { text-decoration: underline; }
        .rich-editor-content .ProseMirror s { text-decoration: line-through; }
        .rich-editor-content .ProseMirror mark { background: rgba(250,204,21,0.4); padding: 0 2px; border-radius: 2px; }
        .rich-editor-content .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin: 0.4em 0; }
        .rich-editor-content .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.4em 0; }
        .rich-editor-content .ProseMirror li { margin: 0.15em 0; font-size: 0.875rem; }
        .rich-editor-content .ProseMirror blockquote { border-left: 3px solid hsl(var(--primary)); padding-left: 1em; margin: 0.5em 0; color: hsl(var(--muted-foreground)); font-style: italic; }
        .rich-editor-content .ProseMirror code { background: hsl(var(--muted)); border-radius: 4px; padding: 1px 4px; font-size: 0.8em; font-family: monospace; }
        .rich-editor-content .ProseMirror pre { background: hsl(var(--muted)); border-radius: 8px; padding: 10px 14px; overflow-x: auto; margin: 0.5em 0; }
        .rich-editor-content .ProseMirror pre code { background: none; padding: 0; }
        .rich-editor-content .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        .rich-editor-content .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: hsl(var(--muted-foreground)); pointer-events: none; height: 0; font-size: 0.875rem; }
      `}</style>
    </div>
  )
}
