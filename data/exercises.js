window.CUBE_EXERCISES = [
  {
    id: "exercise-1", number: 1, pages: "2–3", type: "structure-to-views",
    title: "מבטים מקוביות",
    instruction: "עבור כל מבנה סרטטו תרשים מספרים, מבט מלמעלה, מבט מלפנים, מבט משמאל ומבט מימין.",
    questions: [
      {label:"א׳", structure:[[2,1,1]]},
      {label:"ב׳", structure:[[0,0,1],[1,1,1],[1,0,0]]},
      {label:"ג׳", structure:[[2,1,1],[1,0,1]]},
      {label:"ד׳", structure:[[0,1,2],[2,1,0]]},
      {label:"ה׳", structure:[[3,2,3],[0,0,1],[0,0,1]]},
      {label:"ו׳", structure:[[2,0,0,0],[1,0,0,0],[1,1,1,5]]},
      {label:"ז׳", structure:[[2,1],[0,1]]},
      {label:"ח׳", structure:[[3,2,1,2],[0,1,0,0]]}
    ]
  },
  {
    id: "exercise-2", number: 2, pages: "4", type: "match-structure",
    title: "התאמת מבנה למבטים",
    instruction: "התאימו בין מבנה למבטים הנתונים. בחרו את המבנה המתאים.",
    questions: [
      {label:"א׳", views:{top:[[1,1,1,1],[1,1,1,1]],right:[[0,1],[1,1]],left:[[1,0],[1,1]]}, correct:2, options:[[[1,2,1],[1,1,1],[1,1,1]],[[2,1,2],[1,1,1],[0,1,0]],[[2,2,2,2],[1,1,1,1]]]},
      {label:"ב׳", views:{top:[[1,1,1]],right:[[1],[1]],left:[[1],[1]]}, correct:1, options:[[[3],[1]],[[2,2,1]],[[1,3,1],[1,1,1]]]},
      {label:"ג׳", views:{top:[[1,1,1]],right:[[1],[1]],left:[[1],[1]]}, correct:2, options:[[[2,2],[2,1]],[[1,1,1],[0,1,0]],[[2,1,2]]]},
      {label:"ד׳", views:{front:[[1,0,1],[1,1,1]],top:[[1,1,1],[0,1,0]],right:[[0,1],[1,1]]}, correct:2, options:[[[2,0,2],[1,1,1]],[[2,1,2],[1,0,1]],[[2,1,2],[0,1,0]]]},
      {label:"ה׳", views:{right:[[1],[1]],top:[[1,1,1]],left:[[1],[1]]}, correct:1, options:[[[3],[1]],[[2,2,1]],[[1,3,1],[1,2,1]]]},
      {label:"ו׳", views:{front:[[1,0],[1,1]],top:[[0,1],[1,1],[1,1]],right:[[0,1,0,0],[1,1,1,1]]}, correct:0, options:[[[0,2],[1,1],[1,2]],[[0,2],[1,1],[1,1]],[[0,1],[2,1],[1,1]]]} 
    ]
  },
  {
    id: "exercise-3", number: 3, pages: "5", type: "numbers-to-views",
    title: "מתרשים מספרים למבטים",
    instruction: "עבור כל תרשים מספרים סרטטו מבט מלמעלה, מבט מלפנים, מבט משמאל ומבט מימין.",
    questions: [
      {label:"א׳", numbers:[[0,3,1],[1,2,4],[0,0,2]]},
      {label:"ב׳", numbers:[[4,3,1],[0,2,1],[0,0,2]]},
      {label:"ג׳", numbers:[[1,1,0],[2,4,2],[3,0,0]]},
      {label:"ד׳", numbers:[[0,0,2],[1,0,1],[4,3,2]]}
    ]
  }
];
