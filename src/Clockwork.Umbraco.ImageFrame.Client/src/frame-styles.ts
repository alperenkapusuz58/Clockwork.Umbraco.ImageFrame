import { css } from '@umbraco-cms/backoffice/external/lit';

export const checkerboard = css`
	.cw-checker {
		background-color: #fff;
		background-image: linear-gradient(45deg, #e9e9eb 25%, transparent 25%), linear-gradient(-45deg, #e9e9eb 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #e9e9eb 75%), linear-gradient(-45deg, transparent 75%, #e9e9eb 75%);
		background-size: 16px 16px;
		background-position: 0 0, 0 8px, 8px -8px, -8px 0;
	}
`;
