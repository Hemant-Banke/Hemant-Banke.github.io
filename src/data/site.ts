// -----------------------------------------------------------------------------
// Site identity.
// -----------------------------------------------------------------------------

export const site = {
  name: "Hemant Banke",
  
  handle: "hemant", // used in the terminal prompt: you@portfolio:~$
  
  tagline:
    "I like to work on exciting ideas and challenging problems, and grow a public notebook of what I learn along the way.",
  
    // Short hero intro shown under "Hi, I'm <name>". Edit freely. Supports
    // **bold**, *italic*, __underline__, and \n for a line break.
  intro:
    "I have a background in **Computational Statistics** from Indian Statistical Institute, Kolkata (M.Stat., first division with distinction), and currently work as a Quantitative Strategist at Goldman Sachs (prev. Wells Fargo). \n \
    My research interests centre on **reinforcement learning**, multi-agent RL and model-based RL. I am interested in exploring model-based MARL with spatial beliefs of other agents, and performing differentiable planning under co-learning agents. \n\n \
    I believe Intelligence is emergent, and I want to understand **how multiple intelligent agents interact?** and can their interactions be approximated with rules. Please find more on my research interests [[personal/research-interests|here]].  \n\n \
    **Currently studying**: Graph Neural Networks, MARL, World Models, and Neural Rendering.",

  email: "hemantbanke5@gmail.com",
};

export type Site = typeof site;
