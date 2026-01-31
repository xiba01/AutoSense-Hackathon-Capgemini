/**

 * @param {Array} words 
 * @returns {Array} 
 */
function parseSubtitles(words) {
  if (!words || words.length === 0) return [];

  const segments = [];

  const MAX_CHARS = 42;
  const MAX_DURATION = 3.5;
  const MIN_SILENCE = 0.3;

  let currentSegment = {
    words: [],
    text: "",
    start: words[0].start,
    end: words[0].end,
  };

  for (let i = 0; i < words.length; i++) {
    const wordObj = words[i];
    const prevWord = i > 0 ? words[i - 1] : null;

    let shouldSplit = false;

    if (prevWord) {
      const silenceGap = wordObj.start - prevWord.end;
      if (silenceGap > MIN_SILENCE) shouldSplit = true;
    }

    if (currentSegment.text.length + wordObj.word.length + 1 > MAX_CHARS) {
      shouldSplit = true;
    }

    if (wordObj.end - currentSegment.start > MAX_DURATION) {
      shouldSplit = true;
    }

    if (prevWord && /[.?!]/.test(prevWord.word)) {
      shouldSplit = true;
    }

    if (
      prevWord &&
      /[,]/.test(prevWord.word) &&
      currentSegment.text.length > 15
    ) {
      shouldSplit = true;
    }

    if (shouldSplit) {
      segments.push({
        text: currentSegment.text.trim(),
        start: currentSegment.start,
        end: prevWord.end, 
      });

      currentSegment = {
        words: [wordObj],
        text: wordObj.word,
        start: wordObj.start,
        end: wordObj.end,
      };
    } else {
      currentSegment.words.push(wordObj);
      if (currentSegment.text.length > 0) {
        currentSegment.text += " ";
      }
      currentSegment.text += wordObj.word;
      currentSegment.end = wordObj.end;
    }
  }

  if (currentSegment.text.length > 0) {
    segments.push({
      text: currentSegment.text.trim(),
      start: currentSegment.start,
      end: currentSegment.end,
    });
  }

  return segments;
}

module.exports = { parseSubtitles };
