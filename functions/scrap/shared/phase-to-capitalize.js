const phaseToCapitalize = (text) => {
  return text
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + String(word.slice(1)).toLowerCase(),
    )
    .join(" ");
};

module.exports = { phaseToCapitalize };
