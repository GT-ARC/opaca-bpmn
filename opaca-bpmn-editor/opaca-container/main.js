const dotenv = require("dotenv");
const routes = require('./routes');

dotenv.config();

const PORT = 8082;

// Handle server listening event
routes.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
