export interface TemplateSectionDTO {
    section_name: string;
    display_order: number;
    fields: TemplateFieldDTO[];
}

export interface TemplateFieldDTO {
    field_name: string;
    field_label: string;
    field_type: string;
    unit?: string;
    normal_range_min?: number;
    normal_range_max?: number;
    is_required: boolean;
    display_order: number;
    dropdown_options?: string[];
}

export interface TemplateDTO {
    id: string;
    templateName: string;
    description: string;
    visibility: string;
    createdBy: string;
    creatorName?: string;
    usageCount: number;
    lastUsedAt?: string;
    schema: {
        sections: TemplateSectionDTO[];
    };
    recentUpdates: string[];
}
