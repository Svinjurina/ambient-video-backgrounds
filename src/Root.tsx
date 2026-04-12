import { Composition } from "remotion";
import { AmbientBackground } from "./compositions/AmbientBackground";
import { BlackGoldAmbient } from "./compositions/BlackGoldAmbient";
import { ChironBackground } from "./compositions/ChironBackground";
import { GradientFlow } from "./compositions/GradientFlow";
import { OrganicPaper, organicPaperSchema } from "./compositions/OrganicPaper";
import { OrganicPaperV12, organicPaperV12Schema } from "./compositions/OrganicPaperV12";
import { ParticleField } from "./compositions/ParticleField";

// ── Moment frames for Video #12 (Venus-Pluto) ────────────────────────────────
// Derived from _12_ENG.srt — these are the emotionally pivotal subtitle frames
const V12_MOMENTS = [
  1085,   // "This is not a moral question, it is a structural question."
  3566,   // "But it is not alive."
  3621,   // "It is preserved."
  6213,   // "He does not want to understand you, he wants to predict you."
  7500,   // "this need was a prison"
  13697,  // "Can you love without the need to control?"
  14683,  // "Eurydice disappeared forever."
  15137,  // "I do not believe you will stay if I am not watching you."
  24749,  // "The paradox is perfect."
  26351,  // "Control does not kill attachment, control kills the person."
  27445,  // "you destroyed by the very act of preserving."
  30581,  // "A love that knows how to be alive must also know how to let go."
];

export const Root: React.FC = () => {
  return (
    <>
      {/* ── VIDEO #12 — Venus-Pluto: amor como control ── */}
      <Composition
        id="OrganicPaperV12"
        component={OrganicPaperV12}
        schema={organicPaperV12Schema}
        durationInFrames={31324}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{
          grainIntensity: 1.0,
          inkDensity: 1.0,
          textColor: "#FFFFFF",
          animationSpeed: 3.0,
          orbOpacity: 0.4,
          momentFrames: V12_MOMENTS,
          frozenQuoteIndex: 19,
          quotes: [
            "Love is the child of freedom, never that of domination. — Erich Fromm",
            "Love will not prevail in any situation where one party wants to maintain control. — bell hooks",
            "For one person to love another: perhaps that is the most difficult thing granted us. — Rainer Maria Rilke",
            "Love possesses not, nor would it be possessed; for love is sufficient unto love. — Kahlil Gibran",
            "When we are incomplete, we are always searching for somebody to complete us. — Tom Robbins",
            "Love does not claim possession, but gives freedom. — Rabindranath Tagore",
            "Love does not dominate, it cultivates. — Johann Wolfgang von Goethe",
            "Love is not a reaction, therefore it is free. — Jiddu Krishnamurti",
            "Love, to begin with, is not something that means merging, yielding, uniting with another. — Rainer Maria Rilke",
            "Love is the will to extend one's self for the purpose of nurturing another's spiritual growth. — M. Scott Peck",
            "If our love is only a will to possess, it is not love. — Thich Nhat Hanh",
            "In jealousy there is more of self-love than love. — François de La Rochefoucauld",
            "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it. — Rumi",
            "Think of love as a state of grace — not the means to anything, but the alpha and omega, an end in itself. — Gabriel García Márquez",
            "We cannot possess one another. We can only give and hazard all we have. — Dorothy L. Sayers",
            "There is no safe investment. To love at all is to be vulnerable. — C. S. Lewis",
            "Let there be spaces in your togetherness, and let the winds of the heavens dance between you. — Kahlil Gibran",
            "Jealousy is inconsolable because it cannot know the beloved. — Mason Cooley",
            "Jealousy is the jaundice of the soul. — John Dryden",
            "To love purely is to consent to distance; it is to adore the distance between ourselves and that which we love. — Simone Weil",
          ],
        }}
      />


      {/* ── VIDEO #12 ES — Venus-Pluto: El amor como control ── */}
      <Composition
        id="OrganicPaperV12ES"
        component={OrganicPaperV12}
        schema={organicPaperV12Schema}
        durationInFrames={31909}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{
          grainIntensity: 1.0,
          inkDensity: 1.0,
          textColor: "#FFFFFF",
          animationSpeed: 3.0,
          orbOpacity: 0.4,
          openingText: "Crees que amas.",
          frozenQuoteIndex: 19,
          nameEvents: [
            { name: "Camille Claudel", showFrame: 7869, x: 0.60, y: 0.10 },
            { name: "Rodin",           showFrame: 8169, x: 0.05, y: 0.30 },
            { name: "David Buss",      showFrame: 9827, x: 0.70, y: 0.72 },
            { name: "Orfeo",           showFrame: 12143, x: 0.06, y: 0.09 },
            { name: "Hades",           showFrame: 12579, x: 0.74, y: 0.26 },
            { name: "Eurídice",        showFrame: 12750, x: 0.05, y: 0.68 },
            { name: "Marcel Proust",   showFrame: 18023, x: 0.62, y: 0.12 },
            { name: "Pablo Picasso",   showFrame: 22657, x: 0.04, y: 0.28 },
            { name: "Dora Maar",       showFrame: 22747, x: 0.72, y: 0.65 },
            { name: "John Gottman",    showFrame: 24014, x: 0.06, y: 0.75 },
          ],
          momentFrames: [
            1050,   // "Esta no es una pregunta moral."
            3566,   // "Pero no está viva."
            3643,   // "Está preservado."
            6174,   // "No quiere entenderte."
            7539,   // "esa necesidad era una prisión"
            13773,  // "¿Puedes amar sin necesidad de controlar?"
            14728,  // "Eurídice desapareció para siempre."
            15357,  // "estoy mirando."
            25385,  // "La paradoja es perfecta."
            27042,  // "El control mata a la persona."
            28113,  // "Lo que quisiste preservar, lo destruiste..."
            26859,  // "soltarías?"
          ],
          quotes: [
            "El amor es hijo de la libertad, nunca de la dominación. — Erich Fromm",
            "El amor no puede prevalecer en ninguna situación en la que una de las partes quiera mantener el control. — bell hooks",
            "Que una persona ame a otra: quizás sea eso lo más difícil que se nos ha concedido. — Rainer Maria Rilke",
            "El amor no posee, ni desea ser poseído; porque el amor se basta a sí mismo. — Kahlil Gibran",
            "Cuando somos incompletos, siempre estamos buscando a alguien que nos complete. — Tom Robbins",
            "El amor no reclama posesión, sino que da libertad. — Rabindranath Tagore",
            "El amor no domina, cultiva. — Johann Wolfgang von Goethe",
            "El amor no es una reacción, por eso es libre. — Jiddu Krishnamurti",
            "El amor, para empezar, no es algo que signifique fusionarse, rendirse, unirse con otro. — Rainer Maria Rilke",
            "El amor es la voluntad de extenderse a uno mismo con el propósito de nutrir el crecimiento espiritual del otro. — M. Scott Peck",
            "Si nuestro amor es solo una voluntad de poseer, no es amor. — Thich Nhat Hanh",
            "En los celos hay más amor propio que amor. — François de La Rochefoucauld",
            "Tu tarea no es buscar el amor, sino simplemente buscar y encontrar todas las barreras que has construido dentro de ti mismo contra él. — Rumi",
            "Piensa en el amor como un estado de gracia — no como un medio para algo, sino como el alfa y la omega, un fin en sí mismo. — Gabriel García Márquez",
            "No podemos poseernos los unos a los otros. Solo podemos dar y arriesgar todo lo que tenemos. — Dorothy L. Sayers",
            "No hay inversión segura. Amar en absoluto es ser vulnerable. — C. S. Lewis",
            "Que haya espacios en vuestra unión, y que los vientos del cielo dancen entre vosotros. — Kahlil Gibran",
            "Los celos son inconsolables porque no pueden conocer al ser amado. — Mason Cooley",
            "Los celos son la ictericia del alma. — John Dryden",
            "Amar puramente es consentir la distancia; es adorar la distancia entre nosotros y aquello que amamos. — Simone Weil",
          ],
        }}
      />

      {/* ── VIDEO #11 — OrganicPaper (Saturn-Moon / autosabotaje) ── */}
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
            "El autosabotaje es cuando decimos que queremos algo y luego nos aseguramos de que no suceda. — Alyce Cornyn-Selby",
            "Los seres humanos inventan tantas formas de sabotear sus vidas como de mejorarlas. — Mark Goulston",
            "Una vez que te has identificado con alguna forma de negatividad, no quieres soltarla. — Eckhart Tolle",
            "Lo que muchos de nosotros necesitamos es el valor de tolerar la felicidad sin autosabotearnos. — Nathaniel Branden",
            "Nada saboteará nuestra felicidad de manera más profunda que el miedo a no ser suficientes. — Bill Crawford",
            "Nuestras creencias internas provocan el fracaso antes de que ocurra. — Marshall Goldsmith",
            "Cada uno de nosotros tiene un termostato interior que determina cuánto amor y éxito nos permitimos. — Gay Hendricks",
            "No hago nada contra mí mismo, y sin embargo soy mi propio verdugo. — John Donne",
            "Nuestro mayor enemigo es nuestra propia duda. Saboteamos nuestra grandeza por miedo. — Robin Sharma",
            "La resistencia, por definición, es autosabotaje. — Steven Pressfield",
            "La tragedia de demasiadas personas es que no pueden permitir que la felicidad simplemente esté ahí. — Nathaniel Branden",
            "Nos casamos con la persona equivocada porque no podemos permitirnos ser felices. — Fay Weldon",
            "Tengo tendencia a sabotearlo todo. Miedo al éxito, miedo al fracaso, miedo a tener miedo. — Michael Bublé",
            "La verdadera dificultad es superar la forma en que piensas sobre ti mismo. — Maya Angelou",
            "La duda en uno mismo hace más por sabotear el potencial individual que todas las limitaciones externas juntas. — Brian Tracy",
            "Me saboteo a mí misma por miedo a lo que mi grandeza podría hacer. — Alanis Morissette",
            "El autosabotaje es lo más inteligente que puedes hacer si estás saboteando un yo que en realidad no eres tú. — Armand DiMele",
            "La adicción, el autosabotaje, la procrastinación: todas son formas en que nos negamos a participar plenamente en la vida. — Charles Eisenstein",
            "A veces nos autosaboteamos justo cuando las cosas parecen ir bien. — Maureen Brady",
            "Hacer demasiado no siempre es un acto de amor, sino de sabotaje. — Judith Orloff",
            "Estoy haciendo todo lo posible para sabotear mi carrera. Es algo llamado miedo al éxito. — Jon Stewart",
            "Una parte de mí tenía miedo de disfrutar de la energía positiva durante un período prolongado. — Gay Hendricks",
            "En el momento en que dudas si puedes volar, dejas para siempre de poder hacerlo. — J.M. Barrie",
            "El arte es una guerra entre nosotros mismos y las fuerzas del autosabotaje que nos impedirían hacer nuestro trabajo. — Steven Pressfield",
            "Si tus padres te dijeron que nunca llegarías a nada, quizás te limitas a ti mismo para confirmar esa profecía. — Barbara Field",
            "La procrastinación es, sin duda, nuestra forma favorita de autosabotaje. — Alyce Cornyn-Selby",
            "Las personas con una imagen negativa de sí mismas se sienten incómodas cuando están a punto de tener éxito. — Barbara Field",
            "Queremos las cosas tanto que las saboteamos. — Jack White",
            "Todos somos nuestro peor enemigo. — Sigmund Freud",
            "La autodestrucción y el autosabotaje son con frecuencia solo el comienzo del proceso de auto-resurrección. — Oli Anderson"],
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
