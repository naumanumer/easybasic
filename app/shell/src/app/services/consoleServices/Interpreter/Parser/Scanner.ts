import { Console } from './../../Console';
import { StreamReader } from './StreamReader';
import * as Constants from "./Constants"

const _h = 'h'.charCodeAt(0);
const _o = 'o'.charCodeAt(0);
const _A = 'A'.charCodeAt(0);
const _D = 'D'.charCodeAt(0);
const _E = 'E'.charCodeAt(0);
const _H = 'H'.charCodeAt(0);
const _I = 'I'.charCodeAt(0);
const _M = 'M'.charCodeAt(0);
const _N = 'N'.charCodeAt(0);
const _O = 'O'.charCodeAt(0);
const _P = 'P'.charCodeAt(0);
const _Q = 'Q'.charCodeAt(0);
const _R = 'R'.charCodeAt(0);
const _T = 'T'.charCodeAt(0);
const _V = 'V'.charCodeAt(0);
const _X = 'X'.charCodeAt(0);
const _Z = 'Z'.charCodeAt(0);
const _0 = '0'.charCodeAt(0);
const _9 = '9'.charCodeAt(0);
const _PLS = '+'.charCodeAt(0);
const _MIN = '-'.charCodeAt(0);
const _EQL = '='.charCodeAt(0);
const _LES = '<'.charCodeAt(0);
const _GRT = '>'.charCodeAt(0);
const _NWL = '\n'.charCodeAt(0);
const _DQO = '"'.charCodeAt(0);
const _WSP = ' '.charCodeAt(0);
const _TAB = '\t'.charCodeAt(0);
const _DOT = '.'.charCodeAt(0);
const _AMP = '&'.charCodeAt(0);

const _BNG = '!'.charCodeAt(0);
const _HSH = '#'.charCodeAt(0);
const _DLR = '$'.charCodeAt(0);
const _PRC = '%'.charCodeAt(0);


export class Scanner {

	public stream: StreamReader;
	public lineStarted = true;

	private console: Console

	constructor(console) {
		this.console = console;
	}

	/** set the current position of stream and return it */
	public pos(index: number = this.stream.pos()) {
		return this.stream.pos(index);
	}


	/** Set stream to be scanned */
	public setSource(input: string): void {
		this.stream = new StreamReader(input);
		this.stream.pos(0);
		this.lineStarted = true;
	}

	private finishToken(offset: number, Type: TokenType, text?: string): IToken {
		if (Type == TokenType.Newline) {
			this.lineStarted = true;
		}
		return {
			offset: offset,
			len: this.stream.pos() - offset,
			type: Type,
			text: text || this.stream.substring(offset)
		};
	}

	/** return a string from stream that starts from offset */
	public substring(offset: number, len: number): string {
		return this.stream.substring(offset, offset + len);
	}

	/** Return a scanned token */
	public scan(): IToken {
		let content: string[] = [];
		let offset = this.stream.pos();
		let tokenType;

		var token = this.stream.peekChar()

		if (token == -1) { // EOF
			return this.finishToken(offset, TokenType.EOF);
		}

		// check for line numbers
		if (this.lineStarted) {
			let pos = this.stream.pos();
			if (this._Num()) {
				content = [this.stream.substring(offset, pos)];
				return this.finishToken(offset, TokenType.LineNum, content.join(''));
			}
			this.lineStarted = false;
		}

		while (true) {
			token = this.stream.peekChar()
			offset = this.stream.pos();
			if (token == _WSP || token == _TAB) {
				// skipping all white spaces
				this.stream.advance(1);
				continue;
			}

			// End of Line
			else if (token == _NWL) {
				this.stream.advance(1);
				return this.finishToken(offset, TokenType.EOL, "\n");
			}

			// String
			else if (token == _DQO) {
				var string = this.readString();
				return this.finishToken(offset, TokenType.String, string);
			}

			// Number
			else if (this.readNumber()) {
				return this.finishToken(offset, TokenType.Number);
			}

			// Operators
			else if (this._isOperator()) {
				return this.finishToken(offset, TokenType.Operator)
			}

			// expression delimiter
			else if (Constants.expressionDelimiter.indexOf(token) > -1) {
				this.stream.advance(1);
				return this.finishToken(offset, TokenType.Delim);
			}

			// Statement lineTerminator
			else if (token == ":".charCodeAt(0)) {
				this.stream.advance(1);
				return this.finishToken(offset, TokenType.StatementTerminator);
			}

			// Sigil
			else if (this.stream.advanceIfChar(_BNG) ||
				this.stream.advanceIfChar(_HSH) ||
				this.stream.advanceIfChar(_DLR) ||
				this.stream.advanceIfChar(_PRC)) {
				return this.finishToken(offset, TokenType.Sigil);
			}

			// Keywords
			else {
				var keyword = this.readKeyword();
				return this.finishToken(offset, TokenType.Ident, keyword);
			}
		}
	}

	/** Get a string starts from current position until end of statement */
	public scanTilEndOfStatement(): string {
		var string = "", token;
		while (true) {
			token = this.stream.peekChar();
			if (Constants.statementTerminators.indexOf(token) > -1) {
				break;
			}

		}
		return string;
	}

	/** scan until the given chars not found */
	public scanUntil(delimiter: string[]) {
		var expr = "", token;

		while (true) {
			token = this.scan().text;
			if (delimiter.indexOf(token) > -1 || Constants.statementTerminators.indexOf(token.charCodeAt(0)) > -1
				|| token == "") {
				break;
			}
			expr += token;
		}

		return expr;
	}

	/** Read an identifier */
	private readKeyword(): string {
		var token,
			word = "";

		while (true) {
			token = this.stream.peekChar();
			if (Constants.wordTerminator.indexOf(token) > -1) {
				break;
			}
			word += String.fromCharCode(token);
			this.stream.advance(1);
		}

		return word;
	}

	/** Read a BASIC number */
	private readNumber(): boolean {
		var token = this.stream.peekChar();
		if (token == -1)
			return false;

		if (token == _AMP) {
			this.stream.advance(1);
			token = this.stream.peekChar();

			this.stream.advance(1);
			if (token == _H || token == _h) {
				// read hexa number
				this.readHexa();
				return true; // because &h is also number
			}
			else if (token == _O || token == _o) {
				// read octal number
				this.readOctal();
				return true; // because &o is also number
			}
			else {
				this.stream.goBack(2);
				return false
			}
		}
		else if (Constants.decimalLiterals.indexOf(token) > -1) {
			this.readDecimal();
			return true;
		}

		return false;
	}

	/** Reads a BASIC decimal number */
	private readDecimal() {
		while (true) {
			var token = this.stream.peekChar();
			if (Constants.decimalLiterals.indexOf(token) > -1) {
				this.stream.advance(1);
			}
			else {
				break;
			}
		}
	}

	/** Reads a BASIC Hexadecimal number */
	private readHexa() {

		while (true) {
			var token = this.stream.peekChar();
			if (Constants.hexaDigits.indexOf(token) > -1)
				this.stream.advance(1);

			else
				break;

		}
	}

	/** Read an BASIC octal number */
	private readOctal() {

		while (true) {
			var token = this.stream.peekChar();
			if (Constants.octalDigits.indexOf(token) > -1) {
				this.stream.advance(1);
			}
			else {
				break;
			}
		}
	}

	/** Reads a BASIC string */
	private readString(): string {
		var current = this.stream.peekChar();
		if (current != _DQO)
			return null;

		this.stream.advance(1);
		var builder = '"';
		while (true) {
			current = this.stream.peekChar();
			if (current == _DQO || Constants.lineTerminator.indexOf(current) > -1) {
				break;
			}
			else {
				builder += String.fromCharCode(current);
				this.stream.advance(1);
			}
		}

		if (this.stream.peekChar() == _DQO) {
			this.stream.advance(1);
			builder += '"';
		}

		return builder;
	}

	/** Checks if next token is operator or not */
	private _isOperator(): boolean {
		var token = this.stream.peekChar();
		if (this.stream.advanceIfChars([_EQL, _LES]) || // =<
			this.stream.advanceIfChars([_EQL, _GRT]) || // =>
			this.stream.advanceIfChars([_LES, _GRT]) || // <>
			this.stream.advanceIfChars([_GRT, _LES]) || // ><
			this.stream.advanceIfChars([_LES, _EQL]) || // <=
			this.stream.advanceIfChars([_GRT, _EQL]) || // >=
			this.stream.advanceIfChars([_EQL, _EQL]) || // ==
			this.stream.advanceIfChars([_O, _R])
		) {
			// Double Char Operators
			return true
		} else if (this.stream.advanceIfChars([_M, _O, _D]) ||
			this.stream.advanceIfChars([_N, _O, _T]) ||
			this.stream.advanceIfChars([_A, _N, _D]) ||
			this.stream.advanceIfChars([_N, _O, _T]) ||
			this.stream.advanceIfChars([_X, _O, _R]) ||
			this.stream.advanceIfChars([_E, _Q, _V]) ||
			this.stream.advanceIfChars([_I, _M, _P])) {
			// Triple Char Operator
			return true;
		}
		else if (Constants.operators.indexOf(token) > -1) {
			this.stream.advance(1);
			return true;
		}
		return false;
	}

	/** Checks if next token is Decimal number or not */
	private _Num(): boolean {
		let ch: number;
		ch = this.stream.peekChar();
		if (ch >= _0 && ch <= _9) {
			this.stream.advanceWhileChar((ch) => {
				return ch >= _0 && ch <= _9;
			});
			return true;
		}
		return false;
	}
}

export interface IToken {
	type: TokenType;
	text: string;
	offset: number;
	len: number;
}

export enum TokenType {
	Ident = 0,
	String = 1,
	Number = 2,
	LineNum = 3,
	Whitespace = 4,
	Newline = 5,
	Delim = 13,
	EOF = 17,
	EOL = 29,
	Sigil = 18,
	Operator = 19,
	StatementTerminator = 6,
	CustomToken = 28,
}