const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/userRoutes");
const answerRoutes = require("./routes/answersRoutes");
const behaviouralQuestionRoutes = require("./routes/behaviouralQuestionRoutes");
const generateQuestionRoutes = require("./routes/generateQuestionRoutes");
const inferUserRoleRoutes = require("./routes/inferUserRoleRoutes");
const progressRoutes = require("./routes/progressRoutes");
const resumeParserRoutes = require("./routes/resumeParserRoutes");
const userOnboardingRoutes = require("./routes/userOnboardingRoutes");

app.use("/api", userRoutes);
app.use("/api", answerRoutes);
app.use("/api", behaviouralQuestionRoutes);
app.use("/api", generateQuestionRoutes);
app.use("/api", inferUserRoleRoutes);
app.use("/api", progressRoutes);
app.use("/api", resumeParserRoutes);
app.use("/api", userOnboardingRoutes);

const PORT = process.env.PORT || 5050;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
