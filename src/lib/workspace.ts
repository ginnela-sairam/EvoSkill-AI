import { RoadmapData } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function exportToTasks(roadmap: RoadmapData, accessToken: string) {
  // 1. Create a Task List
  const listRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `EvoSkill: ${roadmap.user_profile_analysis.best_career_path}`,
    }),
  });
  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Failed to create task list: ${errText}`);
  }
  const listData = await listRes.json();
  const taskListId = listData.id;

  // 2. Add tasks for each micro-step
  for (const phase of roadmap.micro_steps_roadmap) {
    for (const step of phase.daily_breakdown) {
      const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: step.title.substring(0, 100), // Ensure it fits in title
          notes: `Phase: ${phase.phase_name}\n${step.estimated_duration_hours ? `Duration: ${step.estimated_duration_hours}h\n` : ''}${step.description}`,
        }),
      });
      if (!taskRes.ok) {
         console.warn(`Failed to add task: ${await taskRes.text()}`);
      }
      await delay(300); // 300ms delay to prevent rate limit
    }
  }
}

export async function exportToDocs(roadmap: RoadmapData, accessToken: string) {
  // 1. Create a new blank Document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `My EvoSkill: ${roadmap.user_profile_analysis.best_career_path}`,
    }),
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create document: ${errText}`);
  }
  const doc = await createRes.json();
  const docId = doc.documentId;

  // 2. Build text to insert
  let textToInsert = `EvoSkill AI Roadmap\nCareer: ${roadmap.user_profile_analysis.best_career_path}\n\n`;
  textToInsert += `Why this path: ${roadmap.user_profile_analysis.why_this_path_suits_them}\n\n`;
  
  if (roadmap.market_analysis) {
    textToInsert += `--- Market Analysis ---\nAverage Salary: ${roadmap.market_analysis.average_salary_range}\nDemand: ${roadmap.market_analysis.demand_level}\nKey Companies: ${roadmap.market_analysis.key_companies.join(', ')}\n\n`;
  }
  
  roadmap.micro_steps_roadmap.forEach((phase) => {
    textToInsert += `--- ${phase.phase_name} ---\nGoal: ${phase.goal}\n`;
    phase.daily_breakdown.forEach((step) => {
      textToInsert += `- ${step.title} ${step.estimated_duration_hours ? `(${step.estimated_duration_hours}h)` : ''}: ${step.description}\n`;
    });
    textToInsert += `\n`;
  });

  // 3. Update the document
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: textToInsert,
          },
        },
      ],
    }),
  });
  if (!updateRes.ok) {
     const errText = await updateRes.text();
     throw new Error(`Failed to update document: ${errText}`);
  }
}

export async function exportToCalendar(roadmap: RoadmapData, accessToken: string) {
  // Add phase start dates or simple blocks.
  // For simplicity, let's schedule the first phase starting tomorrow at 9 AM.
  let startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  for (const phase of roadmap.micro_steps_roadmap) {
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `EvoSkill: ${phase.phase_name}`,
        description: `Goal: ${phase.goal}\n\nTasks:\n` + phase.daily_breakdown.map(s => s.title).join("\n"),
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      }),
    });
    
    if (!calRes.ok) {
       console.warn(`Failed to add calendar event: ${await calRes.text()}`);
    }
    
    await delay(200);

    // Advance 1 week per phase for the calendar block
    startDate.setDate(startDate.getDate() + 7);
  }
}

export async function exportToSheets(roadmap: RoadmapData, accessToken: string) {
  // 1. Create a new Spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: `EvoSkill Roadmap: ${roadmap.user_profile_analysis.best_career_path}`,
      },
    }),
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }
  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;

  // 2. Prepare data rows
  const rows = [
    ["Phase", "Goal", "Task", "Description", "Duration (Hours)", "Status"]
  ];
  
  roadmap.micro_steps_roadmap.forEach((phase) => {
    phase.daily_breakdown.forEach((step) => {
      rows.push([phase.phase_name, phase.goal, step.title, step.description, step.estimated_duration_hours?.toString() || "", "Not Started"]);
    });
  });

  // 3. Update spreadsheet values
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: rows,
    }),
  });
  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to update spreadsheet: ${errText}`);
  }
}

export async function exportToKeep(roadmap: RoadmapData, accessToken: string) {
  throw new Error("Google Keep API is only available for Google Workspace Enterprise customers. This feature is restricted by Google.");
}

