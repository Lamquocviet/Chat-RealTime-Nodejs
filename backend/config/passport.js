import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../src/models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error("Google account missing email"));
        }

        let user = await User.findOne({ email });

        if (!user) {
          const baseUsername = email.split("@")[0];
          let username = baseUsername;
          let count = 1;

          while (await User.findOne({ username })) {
            username = `${baseUsername}${count}`;
            count += 1;
          }

          user = await User.create({
            email,
            username,
            displayName: profile.displayName || baseUsername,
            avatarUrl: profile.photos?.[0]?.value,
            provider: "google",
            googleId: profile.id,
            hashedPassword: null,
          });
        } else {
          const updates = {};

          if (!user.provider || user.provider !== "google") {
            updates.provider = "google";
          }

          if (!user.googleId) {
            updates.googleId = profile.id;
          }

          if (!user.avatarUrl && profile.photos?.[0]?.value) {
            updates.avatarUrl = profile.photos[0].value;
          }

          if (Object.keys(updates).length > 0) {
            await User.updateOne({ _id: user._id }, { $set: updates });
            user = await User.findById(user._id);
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

export default passport;
