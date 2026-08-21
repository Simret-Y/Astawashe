const durationToMs = (value) => {
  const match = /^([0-9]+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return amount * multipliers[unit];
};

const addDuration = (date, duration) => {
  return new Date(date.getTime() + durationToMs(duration));
};

module.exports = { durationToMs, addDuration };
