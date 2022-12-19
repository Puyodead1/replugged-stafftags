import React from "react";

type Props = {
  originalTag: React.ReactElement;
  className: string;
  tagText: string;
  tagColor?: string;
  textColor?: string;
};

function Tag({ originalTag, className, tagText, tagColor, textColor }: Props) {
  return (
    <span>
      {originalTag}
      <span
        className={className}
        style={{
          backgroundColor: tagColor,
          color: textColor,
        }}>
        {tagText}
      </span>
    </span>
  );
}

export default Tag;
