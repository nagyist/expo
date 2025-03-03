import crypto from 'crypto';
import fs from 'fs';

type MergeResults = {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
};
/**
 * Merge two gitignore files together and add a generated header.
 *
 * @param targetGitIgnorePath
 * @param sourceGitIgnorePath
 *
 * @returns `null` if one of the gitignore files doesn't exist. Otherwise, returns the merged contents.
 */
export function mergeGitIgnorePaths(
  targetGitIgnorePath: string,
  sourceGitIgnorePath: string
): null | MergeResults {
  if (!fs.existsSync(targetGitIgnorePath)) {
    // No gitignore in the project already, no need to merge anything into anything. I guess they
    // are not using git :O
    return null;
  }

  if (!fs.existsSync(sourceGitIgnorePath)) {
    // Maybe we don't have a gitignore in the template project
    return null;
  }

  const targetGitIgnore = fs.readFileSync(targetGitIgnorePath).toString();
  const sourceGitIgnore = fs.readFileSync(sourceGitIgnorePath).toString();
  const merged = mergeGitIgnoreContents(targetGitIgnore, sourceGitIgnore);
  // Only rewrite the file if it was modified.
  if (merged.contents) {
    fs.writeFileSync(targetGitIgnorePath, merged.contents);
  }

  return merged;
}

const generatedHeaderPrefix = `# @generated expo-cli`;
export const generatedFooterComment = `# @end expo-cli`;

/**
 * Get line indexes for the generated section of a gitignore.
 *
 * @param gitIgnore
 */
function getGeneratedSectionIndexes(gitIgnore: string): {
  contents: string[];
  start: number;
  end: number;
} {
  const contents = gitIgnore.split('\n');
  const start = contents.findIndex((line) => line.startsWith(generatedHeaderPrefix));
  const end = contents.findIndex((line) => line.startsWith(generatedFooterComment));

  return { contents, start, end };
}

/**
 * Removes the generated section from a gitignore, returns null when nothing can be removed.
 * This sways heavily towards not removing lines unless it's certain that modifications were not made to the gitignore manually.
 *
 * @param gitIgnore
 */
export function removeGeneratedGitIgnoreContents(gitIgnore: string): string | null {
  const { contents, start, end } = getGeneratedSectionIndexes(gitIgnore);
  if (start > -1 && end > -1 && start < end) {
    contents.splice(start, end - start + 1);
    // TODO: We could in theory check that the contents we're removing match the hash used in the header,
    // this would ensure that we don't accidentally remove lines that someone added or removed from the generated section.
    return contents.join('\n');
  }
  return null;
}

/**
 * Merge the contents of two gitignores together and add a generated header.
 *
 * @param targetGitIgnore contents of the existing gitignore
 * @param sourceGitIgnore contents of the extra gitignore
 */
export function mergeGitIgnoreContents(
  targetGitIgnore: string,
  sourceGitIgnore: string
): MergeResults {
  const header = createGeneratedHeaderComment(sourceGitIgnore);
  if (!targetGitIgnore.includes(header)) {
    // Ensure the old generated gitignore contents are removed.
    const sanitizedTarget = removeGeneratedGitIgnoreContents(targetGitIgnore);
    return {
      contents: [
        sanitizedTarget ?? targetGitIgnore,
        header,
        `# The following patterns were generated by expo-cli`,
        ``,
        sourceGitIgnore,
        generatedFooterComment,
      ].join('\n'),
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: targetGitIgnore, didClear: false, didMerge: false };
}

/**
 * Adds the contents into an existing gitignore "generated by expo-cli section"
 * If no section exists, it will be created (hence the name upsert)
 */
export function upsertGitIgnoreContents(
  targetGitIgnorePath: string,
  contents: string
): MergeResults | null {
  const targetGitIgnore = fs.readFileSync(targetGitIgnorePath, {
    encoding: 'utf-8',
    flag: 'a+',
  });

  if (targetGitIgnore.match(new RegExp(`^${contents}$`))) {
    return null;
  }

  // If there is an existing section, update it with the new content
  if (targetGitIgnore.includes(generatedHeaderPrefix)) {
    const indexes = getGeneratedSectionIndexes(targetGitIgnore);

    contents = `${indexes.contents.slice(indexes.start + 3, indexes.end).join('\n')}\n${contents}`;
  }

  const merged = mergeGitIgnoreContents(targetGitIgnore, contents);

  if (merged.contents) {
    fs.writeFileSync(targetGitIgnorePath, merged.contents);
  }
  return merged;
}

export function createGeneratedHeaderComment(gitIgnore: string): string {
  const hashKey = createGitIgnoreHash(getSanitizedGitIgnoreLines(gitIgnore).join('\n'));

  return `${generatedHeaderPrefix} ${hashKey}`;
}

/**
 * Normalize the contents of a gitignore to ensure that minor changes like new lines or sort order don't cause a regeneration.
 */
export function getSanitizedGitIgnoreLines(gitIgnore: string): string[] {
  // filter, trim, and sort the lines.
  return gitIgnore
    .split('\n')
    .filter((v) => {
      const line = v.trim();
      // Strip comments
      if (line.startsWith('#')) {
        return false;
      }
      return !!line;
    })
    .sort();
}

export function createGitIgnoreHash(gitIgnore: string): string {
  // this doesn't need to be secure, the shorter the better.
  const hash = crypto.createHash('sha1').update(gitIgnore).digest('hex');
  return `sync-${hash}`;
}

export function removeFromGitIgnore(targetGitIgnorePath: string, contents: string) {
  if (!fs.existsSync(targetGitIgnorePath)) {
    return;
  }

  let targetGitIgnore = fs.readFileSync(targetGitIgnorePath, 'utf-8');

  if (!targetGitIgnore.includes(contents)) {
    return null;
  }

  targetGitIgnore = targetGitIgnore.replace(`${contents}\n`, '');

  const indexes = getGeneratedSectionIndexes(targetGitIgnore);

  if (indexes.start === indexes.end - 3) {
    targetGitIgnore = targetGitIgnore.replace(
      new RegExp(`^${generatedHeaderPrefix}((.|\n)*)${generatedFooterComment}$`, 'm'),
      ''
    );
  }

  return fs.writeFileSync(targetGitIgnorePath, targetGitIgnore);
}
