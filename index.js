const request = require('request');

module.exports.inviter = (e, context, callback) => {
  const email = e.queryStringParameters.email;
  const output = { message: 'Your invitation has been sent!' };
  let statusCode = 500;

  const options = { formData: {
    token: process.env.SLACK_TOKEN,
    email
  }, json: true };

  request.post('https://darkcooger.slack.com/api/users.admin.invite', options, (err, res) => {
    if (err) {
      output.message = err.message;
    } else {
      // If the account that owns the token is not admin, Slack will oddly
      // return `200 OK`, and provide other information in the body. So we
      // need to check for the correct account scope and call the callback
      // with an error if it's not high enough.
      const { ok, error: providedError, needed} = res.body
      if (!ok) {
        statusCode = 500;
        if (providedError === 'missing_scope' && needed === 'admin') {
          output.message = 'Missing admin scope: The token you provided is for an account that is not an admin. You must provide a token from an admin account in order to invite users through the Slack API.';
        } else if (providedError === 'already_invited') {
          output.message = 'You have already been invited to Slack. Check for an email from feedback@slack.com.';
        } else if (providedError === 'already_in_team') {
          output.message = 'You already belong to darknet chat, goober.';
        } else {
          output.message = providedError;
        }
      } else {
        statusCode = 200;
      }
    }

    callback(null, { statusCode: statusCode, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(output) });
  });
};
