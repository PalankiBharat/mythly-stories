'use client';

import { useMemo } from 'react';
import type { Story, Block, InlineNode } from '@/lib/types';

interface Props {
  story: Story;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

import type { Mark, LinkMark, StoryLinkMark, SanskritMark } from '@/lib/types';

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function renderInlineNodes(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      const marks = node.marks ?? [];
      let out = escapeHtml(node.text);

      // Text formatting
      if (marks.some((m) => m.type === 'bold')) out = `<strong>${out}</strong>`;
      if (marks.some((m) => m.type === 'italic')) out = `<em>${out}</em>`;
      if (marks.some((m) => m.type === 'underline')) out = `<u>${out}</u>`;

      // Sanskrit
      const sanskrit = marks.find((m): m is SanskritMark => m.type === 'sanskrit');
      if (sanskrit) {
        const title = [sanskrit.transliteration, sanskrit.meaning].filter(Boolean).join(' — ');
        out = `<span class="sanskrit-inline" title="${escapeHtml(title)}">${out}${
          sanskrit.transliteration ? ` <span class="sanskrit-roman">(${escapeHtml(sanskrit.transliteration)})</span>` : ''
        }${sanskrit.meaning ? ` <span class="sanskrit-meaning">\u2014 ${escapeHtml(sanskrit.meaning)}</span>` : ''}</span>`;
      }

      // External link — only allow http/https schemes
      const link = marks.find((m): m is LinkMark => m.type === 'link');
      if (link) {
        const safeHref = isSafeUrl(link.href) ? escapeHtml(link.href) : '#';
        const rel = link.target === '_blank' ? ' rel="noopener noreferrer"' : '';
        return `<a href="${safeHref}" target="${escapeHtml(link.target)}"${rel} class="story-link">${out}</a>`;
      }

      // Story link
      const storyLink = marks.find((m): m is StoryLinkMark => m.type === 'storyLink');
      if (storyLink) {
        return `<a href="#" class="story-link">${out}</a>`;
      }

      return out;
    })
    .join('');
}

function renderBlock(block: Block, index: number): string {
  switch (block.type) {
    case 'leadParagraph':
      return `<p class="lead-paragraph">${renderInlineNodes(block.content)}</p>`;
    case 'paragraph':
      return `<p>${renderInlineNodes(block.content)}</p>`;
    case 'dialogue':
      return `<div class="dialogue">
        <span class="speaker">${escapeHtml(block.speaker)}</span>
        <p>${renderInlineNodes(block.content)}</p>
      </div>`;
    case 'sceneImage': {
      const hasUrl = block.url && !block.url.startsWith('@file:');
      const ratioClass = block.aspectRatio === '3:4' ? 'portrait' : block.aspectRatio === '1:1' ? 'square' : '';
      return `<div class="scene-image">
        ${hasUrl
          ? `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" loading="lazy" />`
          : `<div class="img-placeholder${ratioClass ? ' ' + ratioClass : ''}">Image ${index}</div>`
        }
        ${block.caption ? `<div class="caption">${escapeHtml(block.caption)}</div>` : ''}
      </div>`;
    }
    case 'divider':
      return `<div class="ornament" aria-hidden="true">&middot; &middot; &middot;</div>`;
    case 'spacer': {
      const heights: Record<string, string> = { sm: '1.5rem', md: '3rem', lg: '5rem' };
      return `<div style="height:${heights[block.size] ?? '3rem'}" aria-hidden="true"></div>`;
    }
    default:
      return '';
  }
}

function buildHtml(story: Story): string {
  const blocks = story.blocks.map((b, i) => renderBlock(b, i)).join('\n');

  const heroTagsHtml = story.heroMeta
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join('');

  const moralHtml =
    story.moral && story.moral.length > 0
      ? `<div class="mystery">
          <div class="mystery-label">Moral of the Story</div>
          <p>${renderInlineNodes(story.moral)}</p>
        </div>`
      : '';

  const teaserHtml = story.teaser
    ? `<div class="teaser">
        <div class="teaser-label">But wait&hellip;</div>
        <p>${renderInlineNodes(story.teaser.content)}</p>
      </div>`
    : '';

  const heroImageHtml = story.featuredImage?.url
    ? `<img src="${escapeHtml(story.featuredImage.url)}" alt="${escapeHtml(story.featuredImage.alt)}" class="hero-image" onerror="this.style.display='none'" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>

:root {
  --gold: #C4963C;
  --gold-light: #E8C875;
  --saffron: #D4742C;
  --earth: #8B6914;
  --cream: #FDF6E3;
  --parchment: #F5EDDA;
  --ink: #2C1810;
  --ink-light: #4A3728;
  --border-ornate: #C4963C44;
}

*{margin:0;padding:0;box-sizing:border-box}

body{
  background:var(--cream);
  color:var(--ink);
  font-family:'Lora','Georgia',serif;
  line-height:1.85;
  font-size:18px;
}

/* === HERO === */
.hero{
  position:relative;
  width:100%;
  min-height:75vh;
  display:flex;
  align-items:flex-end;
  overflow:hidden;
  background:linear-gradient(135deg,#1a0f08 0%,#2C1810 50%,#3d2114 100%);
}
.hero-image{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  opacity:0.7;
}
.hero-overlay{
  position:absolute;
  inset:0;
  background:linear-gradient(
    to bottom,
    transparent 0%,
    rgba(44,24,16,0.3) 40%,
    rgba(44,24,16,0.85) 75%,
    rgba(44,24,16,0.98) 100%
  );
}
.hero-content{
  position:relative;
  z-index:2;
  width:100%;
  max-width:860px;
  margin:0 auto;
  padding:60px 32px 48px;
}
.hero-source{
  font-family:'Inter',sans-serif;
  font-size:12px;
  letter-spacing:3px;
  text-transform:uppercase;
  color:var(--gold-light);
  margin-bottom:16px;
  opacity:0.9;
}
.hero-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(28px,5vw,52px);
  font-weight:900;
  line-height:1.15;
  color:#FEFCF5;
  margin-bottom:20px;
}
.hero-subtitle{
  font-family:'Lora',serif;
  font-style:italic;
  color:rgba(254,252,245,0.7);
  font-size:1.05rem;
  margin-bottom:18px;
  line-height:1.5;
}
.hero-meta{
  display:flex;
  flex-wrap:wrap;
  gap:20px;
  font-family:'Inter',sans-serif;
  font-size:13px;
  color:#C4963Ccc;
}
.hero-meta span::before{
  content:'';
  display:inline-block;
  width:6px;
  height:6px;
  border-radius:50%;
  background:var(--gold);
  margin-right:8px;
  vertical-align:middle;
}

/* === CONTENT === */
.content{
  max-width:720px;
  margin:0 auto;
  padding:56px 24px 80px;
}

.ornament{
  text-align:center;
  margin:48px 0;
  font-size:24px;
  color:var(--gold);
  letter-spacing:12px;
  opacity:0.6;
}

/* Story paragraphs */
p{margin-bottom:24px;text-align:justify;hyphens:auto}

.lead-paragraph{margin-bottom:24px;text-align:justify;hyphens:auto}
.lead-paragraph::first-letter{
  font-family:'Playfair Display',serif;
  font-size:4.2em;
  float:left;
  line-height:0.8;
  margin-right:10px;
  margin-top:6px;
  color:var(--gold);
  font-weight:900;
}

/* Dialogue */
.dialogue{
  margin:32px 0;
  padding:24px 28px;
  border-left:3px solid var(--gold);
  background:linear-gradient(135deg,var(--parchment) 0%,transparent 100%);
  border-radius:0 8px 8px 0;
  font-style:italic;
}
.dialogue .speaker{
  display:block;
  font-family:'Inter',sans-serif;
  font-size:11px;
  letter-spacing:2px;
  text-transform:uppercase;
  color:var(--saffron);
  margin-bottom:8px;
  font-style:normal;
}
.dialogue p{margin-bottom:0}

/* Scene images */
.scene-image{
  margin:48px -40px;
  position:relative;
}
.scene-image img{
  width:100%;
  border-radius:8px;
  box-shadow:0 8px 32px rgba(44,24,16,0.15);
  display:block;
}
.scene-image .caption{
  font-family:'Inter',sans-serif;
  font-size:12px;
  color:var(--ink-light);
  text-align:center;
  margin-top:12px;
  opacity:0.7;
  font-style:italic;
}
.img-placeholder{
  width:100%;
  aspect-ratio:16/9;
  background:linear-gradient(135deg,#2C1810 0%,#4A3728 100%);
  border-radius:8px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--gold);
  font-family:'Inter',sans-serif;
  font-size:14px;
  opacity:0.5;
}
.img-placeholder.portrait{aspect-ratio:4/5;max-width:480px;margin:0 auto}
.img-placeholder.square{aspect-ratio:1/1;max-width:480px;margin:0 auto}

/* Sanskrit inline */
.sanskrit-inline{font-style:italic;color:var(--earth)}
.sanskrit-roman{font-size:0.85em;color:var(--ink-light);font-style:normal}
.sanskrit-meaning{font-size:0.85em;color:var(--ink-light);font-style:normal}

/* Story links */
.story-link{color:var(--saffron);text-decoration:underline;text-decoration-color:var(--border-ornate)}

/* === MORAL / MYSTERY === */
.mystery{
  margin:56px 0;
  padding:40px 36px;
  background:linear-gradient(135deg,#2C1810 0%,#3d2114 60%,#4a2e1a 100%);
  border-radius:12px;
  position:relative;
  overflow:hidden;
}
.mystery::before{
  content:'\u2728';
  position:absolute;
  top:-20px;
  right:20px;
  font-size:120px;
  opacity:0.05;
}
.mystery-label{
  font-family:'Inter',sans-serif;
  font-size:11px;
  letter-spacing:3px;
  text-transform:uppercase;
  color:var(--gold-light);
  margin-bottom:16px;
}
.mystery p{
  color:#F5EDDA;
  font-size:19px;
  line-height:1.75;
  font-style:italic;
  margin-bottom:0;
  text-align:left;
}

/* === TEASER === */
.teaser{
  margin:48px 0;
  padding:32px;
  border:1px dashed var(--border-ornate);
  border-radius:12px;
  background:var(--parchment);
}
.teaser-label{
  font-family:'Inter',sans-serif;
  font-size:11px;
  letter-spacing:3px;
  text-transform:uppercase;
  color:var(--saffron);
  margin-bottom:12px;
}
.teaser p{color:var(--ink-light);font-size:16px;line-height:1.7;margin-bottom:0;text-align:left}

/* === METADATA === */
.metadata{
  margin-top:64px;
  padding-top:40px;
  border-top:1px solid var(--border-ornate);
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:20px;
}
.meta-card{
  padding:20px;
  background:var(--parchment);
  border-radius:8px;
}
.meta-card.full-width{grid-column:1/-1}
.meta-label{
  font-family:'Inter',sans-serif;
  font-size:10px;
  letter-spacing:2.5px;
  text-transform:uppercase;
  color:var(--gold);
  margin-bottom:8px;
  font-weight:600;
}
.meta-value{font-size:15px;color:var(--ink-light);line-height:1.6}

/* === FOOTER === */
.footer{
  text-align:center;
  padding:48px 24px;
  font-family:'Inter',sans-serif;
  font-size:12px;
  color:var(--ink-light);
  opacity:0.5;
  letter-spacing:1px;
}
.footer .lotus{font-size:28px;display:block;margin-bottom:12px}

/* === RESPONSIVE === */
@media(max-width:768px){
  body{font-size:16px}
  .content{padding:40px 20px 60px}
  .scene-image{margin:36px -8px}
  .metadata{grid-template-columns:1fr}
  .mystery{padding:28px 24px}
  .dialogue{padding:20px 22px}
  .hero{min-height:60vh}
  .hero-content{padding:40px 20px 36px}
}
</style>
</head>
<body>

<header class="hero">
  ${heroImageHtml}
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-source">${escapeHtml(story.source)}</div>
    <h1 class="hero-title">${escapeHtml(story.title)}</h1>
    ${story.subtitle ? `<p class="hero-subtitle">${escapeHtml(story.subtitle)}</p>` : ''}
    <div class="hero-meta">${heroTagsHtml}</div>
  </div>
</header>

<main class="content">

  <div class="ornament">&middot; &middot; &middot;</div>

  <article class="story">
    ${blocks}
  </article>

  ${moralHtml}
  ${teaserHtml}

  <div class="metadata">
    <div class="meta-card full-width">
      <div class="meta-label">Characters</div>
      <div class="meta-value">${escapeHtml(story.metadata.characters)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Theme</div>
      <div class="meta-value">${escapeHtml(story.metadata.theme)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Source</div>
      <div class="meta-value">${escapeHtml(story.metadata.source)}</div>
    </div>
    ${story.metadata.verification ? `<div class="meta-card full-width"><div class="meta-label">Verification</div><div class="meta-value">${escapeHtml(story.metadata.verification)}</div></div>` : ''}
  </div>

</main>

<footer class="footer">
  <span class="lotus">&#x1F33A;</span>
  Mythly Stories &middot; Tales from the Ancient World
</footer>

</body>
</html>`;
}

export function StoryPreview({ story }: Props) {
  const html = useMemo(() => buildHtml(story), [story]);

  return (
    <iframe
      title="Story Preview"
      srcDoc={html}
      className="w-full border-0"
      style={{ minHeight: '100vh', display: 'block' }}
      sandbox="allow-same-origin"
    />
  );
}
