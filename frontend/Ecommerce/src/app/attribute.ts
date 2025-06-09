export interface Attribute {
    id: number;
    name: string;
}

export interface AttributeAndValueDTO {
    attributeId: number;
    attributeName: string;
    value: string[];
}

export interface AttributeValue {
    id: number;
    value: string;
}