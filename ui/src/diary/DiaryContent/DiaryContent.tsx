import React from 'react';
import {
  isBlockquote,
  isBold,
  isBreak,
  isInlineCode,
  isItalics,
  isLink,
  isStrikethrough,
  Inline,
  isBlockCode,
} from '@/types/content';
// eslint-disable-next-line import/no-cycle
import ContentReference from '@/components/References/ContentReference';
import { DiaryBlock, isDiaryImage, NoteContent } from '@/types/diary';
import DiaryContentImage from './DiaryContentImage';

interface DiaryContentProps {
  content: NoteContent;
}

interface InlineContentProps {
  story: Inline;
}

interface BlockContentProps {
  story: DiaryBlock;
}

export function InlineContent({ story }: InlineContentProps) {
  if (typeof story === 'string') {
    return <span>{story}</span>;
  }

  if (isBold(story)) {
    return (
      <strong>
        {story.bold.map((s, k) => (
          <InlineContent key={k} story={s} />
        ))}
      </strong>
    );
  }

  if (isItalics(story)) {
    return (
      <em>
        {story.italics.map((s, k) => (
          <InlineContent key={k} story={s} />
        ))}
      </em>
    );
  }

  if (isStrikethrough(story)) {
    return (
      <span className="line-through">
        {story.strike.map((s, k) => (
          <InlineContent key={k} story={s} />
        ))}
      </span>
    );
  }

  if (isLink(story)) {
    const containsProtocol = story.link.href.match(/https?:\/\//);
    return (
      <a
        target="_blank"
        rel="noreferrer"
        href={containsProtocol ? story.link.href : `//${story.link.href}`}
      >
        {story.link.content || story.link.href}
      </a>
    );
  }

  if (isBlockquote(story)) {
    return (
      <blockquote className="leading-6">
        {Array.isArray(story.blockquote)
          ? story.blockquote.map((item, index) => (
              <InlineContent key={item.toString() + index} story={item} />
            ))
          : story.blockquote}
      </blockquote>
    );
  }

  if (isInlineCode(story)) {
    return (
      <code>
        {typeof story['inline-code'] === 'object' ? (
          <InlineContent story={story['inline-code']} />
        ) : (
          story['inline-code']
        )}
      </code>
    );
  }

  if (isBlockCode(story)) {
    return (
      <pre>
        <code>
          {typeof story.code === 'object' ? (
            <InlineContent story={story.code} />
          ) : (
            story.code
          )}
        </code>
      </pre>
    );
  }

  if (isBreak(story)) {
    return <br />;
  }

  throw new Error(`Unhandled message type: ${JSON.stringify(story)}`);
}

export function BlockContent({ story }: BlockContentProps) {
  if (isDiaryImage(story)) {
    return (
      <DiaryContentImage
        src={story.image.src}
        height={story.image.height}
        width={story.image.width}
        altText={story.image.alt}
      />
    );
  }

  if ('cite' in story) {
    return (
      <div className="my-4 text-base">
        <ContentReference cite={story.cite} />
      </div>
    );
  }

  throw new Error(`Unhandled message type: ${JSON.stringify(story)}`);
}

export default function DiaryContent({ content }: DiaryContentProps) {
  return (
    <article className="text-[18px] leading-[26px]">
      {content.map((c, index) => {
        if ('block' in c) {
          return <BlockContent key={index} story={c.block} />;
        }

        return (
          <p key={index}>
            {c.inline.map((con, i) => (
              <InlineContent key={i} story={con} />
            ))}
          </p>
        );
      })}
    </article>
  );
}
