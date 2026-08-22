const logger = require('../config/logger');

// Stand-in for SES/Nodemailer+SMTP - logs instead of sending. Swap this
// module for a real transport later; callers only see send({to, subject, body}).
async function send({ to, subject, body }) {
  logger.info('mailer.send', { to, subject, body });
  return { delivered: true };
}

module.exports = { send };
