// -----------------------------------------------------------------------------
// Site identity.
// -----------------------------------------------------------------------------

export const site = {
  name: "Hemant Banke",
  
  handle: "hemant", // used in the terminal prompt: you@portfolio:~$
  
  tagline:
    "I build durable systems, work on exciting ideas and grow a public notebook of what I learn along the way.",
  
    // Short hero intro shown under "Hi, I'm <name>". Edit freely. Supports
    // **bold**, *italic*, __underline__, and \n for a line break.
  intro:
    "I have background in **Computational Statistics** from Indian Statistical Institute, Kolkata (M.Stat.), and currently work as a Quantitative Strategist at Goldman Sachs (prev. Wells Fargo). \n \
    My research interests centre on **reinforcement learning** and multi-agent RL, building on hands-on experience across optimization, stochastic processes, Monte Carlo and MCMC methods, and engineering large-scale simulations. \n\n \
    **Currently studying**: Graph Neural Networks, MARL, World Models, and Neural Rendering.",

  email: "hemantbanke5@gmail.com",
};

export type Site = typeof site;
