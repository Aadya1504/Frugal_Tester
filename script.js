// script.js
// Sample questions for three categories and difficulties.
// Each question object: {id,category,difficulty,question,options,answer}
const QUESTIONS = [
    // General - medium
    {id:1,category:'general',difficulty:'medium',
     question:'What is the capital of France?',
     options:['Berlin','Madrid','Paris','Rome'], answer:2},
    {id:2,category:'general',difficulty:'medium',
     question:'Which planet is known as the Red Planet?',
     options:['Earth','Mars','Jupiter','Saturn'], answer:1},
    {id:3,category:'general',difficulty:'medium',
     question:'Which language is primarily used for Android development?',
     options:['Kotlin','Swift','Ruby','Go'], answer:0},
    {id:4,category:'general',difficulty:'medium',
     question:'Which data structure uses FIFO order?',
     options:['Stack','Queue','Tree','Graph'], answer:1},
    {id:5,category:'general',difficulty:'medium',
     question:'Which HTML tag is used for JavaScript?',
     options:['<script>','<js>','<javascript>','<code>'], answer:0},
  
    // Programming - easy/medium/hard mix
    {id:11,category:'programming',difficulty:'easy',
     question:'Which method adds an element to end of array in JavaScript?',
     options:['push()','pop()','shift()','unshift()'], answer:0},
    {id:12,category:'programming',difficulty:'medium',
     question:'What does CSS stand for?',
     options:['Computer Style Sheets','Cascading Style Sheets','Creative Style Syntax','Colorful Style Sheets'], answer:1},
    {id:13,category:'programming',difficulty:'hard',
     question:'In Big-O, what is the average time of quicksort?',
     options:['O(n)','O(n log n)','O(n^2)','O(log n)'], answer:1},
  
    // Aptitude
    {id:21,category:'aptitude',difficulty:'easy',
     question:'Find missing: 2, 4, 6, __, 10',
     options:['7','8','9','6'], answer:1},
    {id:22,category:'aptitude',difficulty:'medium',
     question:'0.75, 2.5, __, 9, 17 -> which fills blank?',
     options:['4.5','0.05','4','5'], answer:0},
  ];
  
  let state = {
    questions: [],
    currentIndex: 0,
    perQuestionTime: 20, // seconds
    timer: null,
    timeLeft: 0,
    answers: [], // store {questionId,selectedIndex,timeTaken}
    times: [], // time spent per question
    startTimeForQuestion: null,
  };
  
  // DOM elements
  const startBtn = document.getElementById('startBtn');
  const landing = document.getElementById('landing');
  const quiz = document.getElementById('quiz');
  const results = document.getElementById('results');
  const qNumber = document.getElementById('q-number');
  const questionText = document.getElementById('question-text');
  const optionsDiv = document.getElementById('options');
  const timeLeftSpan = document.getElementById('time-left');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const restartBtn = document.getElementById('restartBtn');
  const categorySelect = document.getElementById('category');
  const difficultySelect = document.getElementById('difficulty');
  
  startBtn.addEventListener('click', startQuiz);
  prevBtn.addEventListener('click', prevQuestion);
  nextBtn.addEventListener('click', nextQuestion);
  submitBtn.addEventListener('click', submitQuiz);
  restartBtn.addEventListener('click', restart);
  
  function startQuiz(){
    const cat = categorySelect.value;
    const diff = difficultySelect.value;
    state.questions = QUESTIONS.filter(q => q.category===cat && q.difficulty===diff);
    if(state.questions.length===0){
      // fallback: pick questions from category only
      state.questions = QUESTIONS.filter(q => q.category===cat).slice(0,5);
    }
    state.currentIndex = 0;
    state.answers = [];
    state.times = [];
    landing.classList.add('hidden');
    results.classList.add('hidden');
    quiz.classList.remove('hidden');
    renderQuestion();
  }
  
  function renderQuestion(){
    const q = state.questions[state.currentIndex];
    qNumber.textContent = `Question ${state.currentIndex+1} / ${state.questions.length}`;
    questionText.innerHTML = q.question;
    optionsDiv.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const el = document.createElement('div');
      el.className = 'option';
      el.dataset.index = idx;
      el.textContent = `${idx+1}. ${opt}`;
      el.addEventListener('click', () => selectOption(idx));
      optionsDiv.appendChild(el);
    });
    // mark selected if exists
    const existing = state.answers.find(a => a.questionId===q.id);
    if(existing){
      const node = optionsDiv.querySelector(`.option[data-index="${existing.selectedIndex}"]`);
      if(node) node.classList.add('selected');
    }
    // timer
    startTimer();
    // record start time for question
    state.startTimeForQuestion = Date.now();
  }
  
  function selectOption(index){
    const q = state.questions[state.currentIndex];
    // unselect others
    optionsDiv.querySelectorAll('.option').forEach(n => n.classList.remove('selected'));
    const chosen = optionsDiv.querySelector(`.option[data-index="${index}"]`);
    chosen.classList.add('selected');
  
    // record selection, but keep time on submit
    const prev = state.answers.find(a => a.questionId===q.id);
    if(prev) prev.selectedIndex = index;
    else state.answers.push({questionId:q.id, selectedIndex:index, timeTaken:null});
  }
  
  function startTimer(){
    clearInterval(state.timer);
    state.timeLeft = state.perQuestionTime;
    timeLeftSpan.textContent = state.timeLeft;
    state.timer = setInterval(() => {
      state.timeLeft--;
      timeLeftSpan.textContent = state.timeLeft;
      if(state.timeLeft<=0){
        clearInterval(state.timer);
        autoSubmitQuestion();
      }
    }, 1000);
  }
  
  function autoSubmitQuestion(){
    // If no answer, record selectedIndex = null
    recordTimeForCurrentQuestion();
    if(state.currentIndex < state.questions.length - 1){
      state.currentIndex++;
      renderQuestion();
    } else {
      submitQuiz();
    }
  }
  
  function recordTimeForCurrentQuestion(){
    const q = state.questions[state.currentIndex];
    const timeSpent = Math.min(state.perQuestionTime, Math.round((Date.now() - state.startTimeForQuestion)/1000));
    state.times.push({questionId:q.id, time: timeSpent});
    // update answer object timeTaken
    const a = state.answers.find(x => x.questionId===q.id);
    if(a) a.timeTaken = timeSpent;
    else state.answers.push({questionId:q.id, selectedIndex:null, timeTaken:timeSpent});
  }
  
  function prevQuestion(){
    recordTimeForCurrentQuestion();
    if(state.currentIndex>0){
      state.currentIndex--;
      renderQuestion();
    }
  }
  
  function nextQuestion(){
    recordTimeForCurrentQuestion();
    if(state.currentIndex < state.questions.length-1){
      state.currentIndex++;
      renderQuestion();
    }
  }
  
  function submitQuiz(){
    clearInterval(state.timer);
    // ensure all questions have time recorded
    if(state.startTimeForQuestion) recordTimeForCurrentQuestion();
  
    // compute results
    const detailed = state.questions.map(q => {
      const ans = state.answers.find(a => a.questionId===q.id);
      const selectedIndex = ans ? ans.selectedIndex : null;
      const timeTaken = ans ? (ans.timeTaken ?? state.perQuestionTime) : state.perQuestionTime;
      const correct = selectedIndex === q.answer;
      return {
        id:q.id, qtext: q.question, selectedIndex, correct, timeTaken
      };
    });
  
    const correctCount = detailed.filter(d => d.correct).length;
    const wrongCount = detailed.length - correctCount;
    const total = detailed.length;
    const percent = Math.round((correctCount/total)*100);
  
    // show summary
    const summary = document.getElementById('summary');
    summary.innerHTML = `
      <p><strong>Score:</strong> ${correctCount} / ${total} (${percent}%)</p>
      <p><strong>Correct:</strong> ${correctCount} &nbsp; <strong>Wrong:</strong> ${wrongCount}</p>
      <h3>Per-question time spent (seconds)</h3>
      <ul>
        ${detailed.map(d => `<li>Q ${d.id}: ${d.timeTaken}s — ${d.correct ? 'Correct' : 'Wrong'}</li>`).join('')}
      </ul>
    `;
  
    quiz.classList.add('hidden');
    results.classList.remove('hidden');
  
    // draw charts
    drawTimeChart(detailed);
    drawCorrectChart(detailed);
    // also log results to console (for automation to capture)
    console.log('DETAILED_RESULTS', JSON.stringify(detailed));
  }
  
  function drawTimeChart(dets){
    const ctx = document.getElementById('chartTime').getContext('2d');
    const labels = dets.map(d => `Q${d.id}`);
    const data = dets.map(d => d.timeTaken);
    if(window.timeChart) window.timeChart.destroy();
    window.timeChart = new Chart(ctx, {
      type:'bar',
      data:{
        labels,
        datasets:[{label:'Time (s)',data}]
      },
    });
  }
  function drawCorrectChart(dets){
    const ctx = document.getElementById('chartCorrect').getContext('2d');
    const correctCount = dets.filter(d=>d.correct).length;
    const wrongCount = dets.length - correctCount;
    if(window.correctChart) window.correctChart.destroy();
    window.correctChart = new Chart(ctx, {
      type:'pie',
      data:{
        labels:['Correct','Wrong'],
        datasets:[{data:[correctCount,wrongCount]}]
      }
    });
  }
  
  function restart(){
    // reset everything
    landing.classList.remove('hidden');
    results.classList.add('hidden');
    state = {
      questions: [], currentIndex:0, perQuestionTime:20, timer:null, timeLeft:0,
      answers:[], times:[], startTimeForQuestion:null
    };
  }
  