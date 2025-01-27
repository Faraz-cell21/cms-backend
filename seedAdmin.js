const bcrypt = require('bcryptjs');

(async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("12345", salt);
  console.log(hashedPassword);
})();
