const sgMail = require("@sendgrid/mail");

module.exports = async (req, res) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const data = JSON.parse(req.payload);

    const msg = {
      to: data.email,
      from: process.env.FROM_EMAIL,
      subject: "MMTTC Workshop Registration Confirmation",
      text: `
Hello ${data.name},

Thank you for registering for the workshop on "Python for Artificial Intelligence Driven Teaching & Research" (Dec 15–19, 2025).

Here are your registration details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Organisation: ${data.organisation}
Designation: ${data.designation}
Contact Method: ${data.contactMethod}
Motivation: ${data.motivation}

Regards,
MMTTC, University of Jammu
      `,
    };

    await sgMail.send(msg);

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: err.toString() });
  }
};
