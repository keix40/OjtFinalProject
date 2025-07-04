export interface Attribute {
    id: number;
    name: string;
}

export interface AttributeAndValueDTO {
    attributeId?: number; // optional
    attributeName?: string;
    values: { value: string }[];
}

export interface AttributeValue {
    id: number;
    value: string;
}