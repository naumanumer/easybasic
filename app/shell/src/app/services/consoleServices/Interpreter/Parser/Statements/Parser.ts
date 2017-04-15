import { ExpressionParser } from './../ExpressionParser';
import { Console } from './../../../Console';
import { IToken, Scanner } from './../Scanner';
import { CLSParser } from "./CLS";

export function StatementParser(token: IToken, scanner: Scanner, console: Console, expressionParser: ExpressionParser) {

    switch (token.text.toUpperCase()) {

        case "CLS":
            return CLSParser(scanner, console, expressionParser);
        
    }
}