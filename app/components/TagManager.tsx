'use client';

import { TagManagerProps } from "../types/interfaces";

export default function TagManager({ tags, maxTags = 10, onTagsChange, error }: TagManagerProps) {
  const addTag = () => {
    if (tags.length < maxTags) {
      onTagsChange([...tags, '']);
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onTagsChange(newTags);
  };

  const updateTag = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index] = value;
    onTagsChange(newTags);
  };

  return (
    <div>
      <label className="form-label dark:text-white">
        🏷️ Tags * (minimum 1, maximum {maxTags})
      </label>
      <div className="space-y-2">
        {tags.map((tag, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={tag}
              onChange={(e) => updateTag(index, e.target.value)}
              className="form-input flex-1 dark:placeholder-white/80 dark:text-white"
              placeholder={`Tag ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="btn btn-danger px-3"
              aria-label="Remove tag"
            >
              🗑️
            </button>
          </div>
        ))}
        {tags.length < maxTags && (
          <button
            type="button"
            onClick={addTag}
            className="btn btn-success text-sm"
          >
            ➕ Add tag
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
