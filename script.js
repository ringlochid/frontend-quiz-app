const main_content = document.querySelector('main');
const theme_mod_switch = document.getElementById('theme-toggle');

const start_menu = document.querySelector('.start-menu');
const start_menu_subjects = document.querySelectorAll('button.subject-item');

const quiz_wrapper = document.querySelector('.deactivated');
const question_form = document.querySelector('.question-menu');
const question_count_el = document.querySelector('.question-count');
const question_body_el = document.querySelector('.question-body');
const progress_bar_el = document.querySelector('.progress__bar');
const answer_option_labels = document.querySelectorAll('.answer-option');
const submit_button = document.querySelector('.submit-btn');

let data_cache = null;
let questions_cache = [];

class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

class Queue {
    constructor() {
        this.first = null;
        this.last = null;
        this.size = 0;
    }
    enqueue(data) {
        const newNode = new Node(data);
        if (this.size === 0) {
        this.first = this.last = newNode;
        } else {
        this.last.next = newNode;
        this.last = newNode;
        }
        this.size++;
    }
    dequeue() {
        if (this.size === 0) return null;
        const curr = this.first;
        this.first = this.first.next;
        this.size--;
        if (this.size === 0) this.last = null;
        return curr.data;
    }
    get_size() {
        return this.size;
    }
    is_empty() {
        return this.size === 0;
    }
}

async function get_quiz_data() {
    const url = './data.json';
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Response status: ${res.status}`);
    }
    return res.json();
}

async function init() {
    try {
        const data = await get_quiz_data();
        data_cache = data;
        questions_cache = data.quizzes;
    } catch (e) {
        console.error(e);
    }
}

const data_ready = init();

function quiz_filter(type) {
    const curr_data = questions_cache.filter(q => q.title === type);
    if (curr_data.length === 0) return null;

    const curr_questions = curr_data[0].questions;
    const questions_que = new Queue();
    curr_questions.forEach(q => questions_que.enqueue(q));
    return questions_que;
}

let currentQueue = null;
let currentQuestion = null;
let currentIndex = 0;
let totalQuestions = 0;
let score = 0;

// submit or next mode?
let hasSubmittedCurrent = false;

// last question?
let islastquestion = false;

function show_quiz_screen() {
    start_menu.style.display = 'none';
    quiz_wrapper.classList.remove('deactivated');
}

function show_start_screen() {
    quiz_wrapper.classList.add('deactivated');
    start_menu.style.display = 'flex';
}

function clear_selected_answer() {
    answer_option_labels.forEach(label => {
        label.style.cursor = 'pointer';
        const radio = label.querySelector('input[type="radio"]');
        if (radio.checked){radio.checked = false;}
        radio.disabled = false;
    });
}

function reset_answer_states() {
  answer_option_labels.forEach(label => {
        const iconSlot = label.querySelector('.answer-icon-slot');
        if (iconSlot) {
            iconSlot.classList.remove('correct', 'error');
            label.classList.remove('correct', 'error');
    }
  });
}

function render_question() {
    if (!currentQuestion) return;

    question_body_el.textContent = currentQuestion.question;

    question_count_el.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    const progressPercent = (currentIndex / totalQuestions) * 100;
    progress_bar_el.style.width = `${progressPercent}%`;

    currentQuestion.options.forEach((optText, idx) => {
        const label = answer_option_labels[idx];
        const radio = label.querySelector('input[type="radio"]');
        const textSpan = label.querySelector('.option-text');

        textSpan.textContent = optText;
        radio.value = optText;
        radio.checked = false;
    });

    reset_answer_states();
    hasSubmittedCurrent = false;
    submit_button.textContent = 'Submit Answer';
}

function get_selected_answer() {
    const checked = question_form.querySelector('input[type="radio"]:checked');
    return checked ? checked.value : null;
}

function show_required() {
    const msg = question_form.querySelector('.required-msg');
    msg.style.display = 'flex';
}

function hide_required() {
    const msg = question_form.querySelector('.required-msg');
    msg.style.display = 'none';
}


function show_feedback(userAnswer) {
    answer_option_labels.forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        const iconSlot = label.querySelector('.answer-icon-slot');
        if (!iconSlot) return;

        iconSlot.classList.remove('correct', 'error');

        if (radio.value === currentQuestion.answer) {
            iconSlot.classList.add('correct');
            if (radio.value === userAnswer) {
                label.classList.add('correct');
                return;
            }
        } else if (radio.value === userAnswer) {
            iconSlot.classList.add('error');
            label.classList.add('error');
        }
        label.style.cursor = 'not-allowed';
        radio.disabled = true;
    });
}

function process_submission() {
    const userAnswer = get_selected_answer();
    if (!userAnswer) {
        show_required();
        return false;
    }

    if (userAnswer === currentQuestion.answer) {
        score++;
    }

    show_feedback(userAnswer);
    return true;
}

async function start_quiz(subjectName) {
    await data_ready;

    const queue = quiz_filter(subjectName);
    if (!queue) {
        alert('No quiz for this subject yet.');
        return;
    }

    currentQueue = queue;
    totalQuestions = queue.get_size();
    currentIndex = 0;
    score = 0;

    currentQuestion = currentQueue.dequeue();

    clear_selected_answer();
    show_quiz_screen();
    render_question();
}

start_menu_subjects.forEach(btn => {
    btn.addEventListener('click', () => {
            const subjectName = btn.querySelector('.subject-name').textContent.trim();
            start_quiz(subjectName);
    });
});

answer_option_labels.forEach(label => {
    const radio = label.querySelector('input[type="radio"]');
    radio.addEventListener('checked', () => {
        hide_required();
    });
});

question_form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentQuestion) return;

    if (!hasSubmittedCurrent) {
        const ok = process_submission();
        if (!ok) return;

        hasSubmittedCurrent = true;
        submit_button.textContent = 'Next Question';
        return;
    }

    currentIndex++;

    if (currentQueue.is_empty()) {
        progress_bar_el.style.width = '100%';
        alert(`Quiz finished! You scored ${score} / ${totalQuestions}.`);

        show_start_screen();
        currentQueue = null;
        currentQuestion = null;
        hasSubmittedCurrent = false;
        submit_button.textContent = 'Submit Answer';
        return;
    }

    currentQuestion = currentQueue.dequeue();
    clear_selected_answer();
    render_question();
});


theme_mod_switch.addEventListener('change', () => {
    if (theme_mod_switch.checked) {
        main_content.classList.remove('lightmod');
        main_content.classList.add('darkmod');
    } else {
        main_content.classList.remove('darkmod');
        main_content.classList.add('lightmod');
    }
});
