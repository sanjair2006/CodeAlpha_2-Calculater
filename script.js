const result = document.getElementById("result");
const expression = document.getElementById("expression");

let input = "";
let finished = false;

function appendValue(value) {
    const operators = ["+", "-", "*", "/", "%"];

    if (finished && /[0-9.(]/.test(value)) {
        input = "";
    }

    finished = false;

    if (operators.includes(value)) {
        if (!input && value !== "-") return;

        if (operators.includes(input.slice(-1))) {
            if (value === "-" && input.slice(-1) === "/") {
                input += value;
                updateDisplay();
                return;
            }

            input = input.slice(0, -1);
        }
    }

    if (value === ".") {
        const current = input.split(/[+\-*/()%]/).pop();

        if (current.includes(".")) return;
    }

    input += value;
    updateDisplay();
}

function clearDisplay() {
    input = "";
    finished = false;
    result.value = "0";
    expression.textContent = "Ready to calculate";
}

function deleteLast() {
    input = input.slice(0, -1);
    finished = false;
    updateDisplay();
}

function calculateExpression(text) {
    const tokens = text.match(
        /(?:\d+\.?\d*|\.\d+)|[()+\-*/%]/g
    );

    if (!tokens || tokens.join("") !== text) {
        throw new Error("Invalid expression");
    }

    let pos = 0;

    function factor() {
        const token = tokens[pos++];

        if (token === "+") return factor();
        if (token === "-") return -factor();

        if (token === "(") {
            const value = addSub();

            if (tokens[pos++] !== ")") {
                throw new Error("Missing bracket");
            }

            return value;
        }

        if (!token || !/^(\d+\.?\d*|\.\d+)$/.test(token)) {
            throw new Error("Invalid number");
        }

        return Number(token);
    }

    function percent() {
        let value = factor();

        while (tokens[pos] === "%") {
            pos++;
            value /= 100;
        }

        return value;
    }

    function multiplyDivide() {
        let value = percent();

        while (tokens[pos] === "*" || tokens[pos] === "/") {
            const op = tokens[pos++];
            const next = percent();

            if (op === "/" && next === 0) {
                throw new Error("Cannot divide by zero");
            }

            value = op === "*" ? value * next : value / next;
        }

        return value;
    }

    function addSub() {
        let value = multiplyDivide();

        while (tokens[pos] === "+" || tokens[pos] === "-") {
            const op = tokens[pos++];
            const next = multiplyDivide();

            value = op === "+" ? value + next : value - next;
        }

        return value;
    }

    const answer = addSub();

    if (pos !== tokens.length || !Number.isFinite(answer)) {
        throw new Error("Invalid expression");
    }

    return answer;
}

function formatNumber(number) {
    return String(Number(number.toPrecision(12)));
}

function updateDisplay() {
    expression.textContent = input || "Ready to calculate";

    if (!input) {
        result.value = "0";
        return;
    }

    try {
        const answer = calculateExpression(input);
        result.value = formatNumber(answer);
    } catch {
        result.value = "…";
    }
}

function calculate() {
    if (!input) return;

    try {
        const answer = calculateExpression(input);

        expression.textContent = input + " =";
        result.value = formatNumber(answer);
        input = result.value;
        finished = true;
    } catch (error) {
        result.value = "Error";
        expression.textContent =
            error.message === "Cannot divide by zero"
                ? "Cannot divide by zero"
                : "Invalid expression";

        input = "";
        finished = false;
    }
}

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        appendValue(key);
    } else if (["+", "-", "*", "/", "%", "(", ")"].includes(key)) {
        appendValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearDisplay();
    }
});