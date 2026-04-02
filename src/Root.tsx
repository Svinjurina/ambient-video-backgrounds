import { Composition } from "remotion";
import { AmbientBackground } from "./compositions/AmbientBackground";
import { BlackGoldAmbient } from "./compositions/BlackGoldAmbient";
import { ChironBackground } from "./compositions/ChironBackground";
import { GradientFlow } from "./compositions/GradientFlow";
import { OrganicPaper, organicPaperSchema } from "./compositions/OrganicPaper";
import { ParticleField } from "./compositions/ParticleField";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="OrganicPaper"
        component={OrganicPaper}
        schema={organicPaperSchema}
        durationInFrames={36000}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{
          grainIntensity: 1.0,
          inkDensity: 1.0,
          quotes: [
            "Self-sabotage is when we say we want something and then go about making sure it doesn't happen. — Alyce Cornyn-Selby",
            "Human beings invent just as many ways to sabotage their lives as to improve them. — Mark Goulston",
            "Once you have identified with some form of negativity, you do not want to let it go. — Eckhart Tolle",
            "What is required for many of us is the courage to tolerate happiness without self-sabotage. — Nathaniel Branden",
            "Nothing will sabotage our happiness more thoroughly than the fear that we are not enough. — Bill Crawford",
            "Our inner beliefs trigger failure before it happens. — Marshall Goldsmith",
            "Each of us has an inner thermostat that determines how much love and success we allow ourselves. — Gay Hendricks",
            "But I do nothing upon myself, and yet I am my own executioner. — John Donne",
            "Our biggest enemy is our own self-doubt. We sabotage our greatness because of our fear. — Robin Sharma",
            "Resistance by definition is self-sabotage. — Steven Pressfield",
            "The tragedy of too many people is that they cannot allow happiness just to be there. — Nathaniel Branden",
            "We marry the wrong person because we cannot let ourselves be happy. — Fay Weldon",
            "I have a tendency to sabotage everything. Fear of success, fear of failure, fear of being afraid. — Michael Bublé",
            "The real difficulty is to overcome how you think about yourself. — Maya Angelou",
            "Self-doubt does more to sabotage individual potential than all external limitations put together. — Brian Tracy",
            "I sabotage myself for fear of what my bigness could do. — Alanis Morissette",
            "Self-sabotage is the smartest thing you can do if you're sabotaging a self that is not really you. — Armand DiMele",
            "Addiction, self-sabotage, procrastination — all ways that we withhold our full participation in life. — Charles Eisenstein",
            "Sometimes we self-sabotage just when things seem to be going smoothly. — Maureen Brady",
            "Doing too much is not always an act of love but of sabotage. — Judith Orloff",
            "I'm doing everything I can to sabotage my career. It's a little thing called fear of success. — Jon Stewart",
            "Some part of me was afraid of enjoying positive energy for any extended period of time. — Gay Hendricks",
            "The moment you doubt whether you can fly, you cease forever to be able to do it. — J.M. Barrie",
            "Art is a war between ourselves and the forces of self-sabotage that would stop us from doing our work. — Steven Pressfield",
            "If your parents told you that you'll never amount to much, maybe you handicap yourself to confirm that prophecy. — Barbara Field",
            "Procrastination is, hands down, our favorite form of self-sabotage. — Alyce Cornyn-Selby",
            "People with a negative self-image become uncomfortable when they are close to succeeding. — Barbara Field",
            "We want things so much that we sabotage them. — Jack White",
            "We are all our own worst enemy. — Sigmund Freud",
            "Self-destruction and self-sabotage are often just the start of the self-resurrection process. — Oli Anderson",
          ],
          textColor: "#FFFFFF",
          animationSpeed: 3.0,
          orbOpacity: 0.4,
        }}
      />
      <Composition
        id="BlackGoldAmbient"
        component={BlackGoldAmbient}
        durationInFrames={36000}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          glowIntensity: 1.0,
        }}
      />
      <Composition
        id="ChironBackground"
        component={ChironBackground}
        durationInFrames={36000}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          coreColor: "#5b2d9e",
          midColor: "#1e3a8a",
          rimColor: "#7c3aed",
          particleCount: 120,
        }}
      />
      <Composition
        id="AmbientBackground"
        component={AmbientBackground}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          colorA: "#0f0c29",
          colorB: "#302b63",
          colorC: "#24243e",
        }}
      />
      <Composition
        id="GradientFlow"
        component={GradientFlow}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          speed: 1,
          colors: ["#667eea", "#764ba2", "#f093fb", "#f5576c"],
        }}
      />
      <Composition
        id="ParticleField"
        component={ParticleField}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          particleCount: 80,
          baseColor: "#00d2ff",
        }}
      />
    </>
  );
};
